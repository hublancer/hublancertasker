/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/document";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Initialize the Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Cloud Function to update the offerCount on a task when a new offer is created.
 */
exports.incrementOfferCount = onDocumentCreated(
  "tasks/{taskId}/offers/{offerId}",
  async (event) => {
    logger.info("New offer detected, incrementing offer count.");

    const taskId = event.params.taskId;
    const taskRef = db.doc(`tasks/${taskId}`);

    try {
      // Atomically increment the offerCount field
      await taskRef.update({
        offerCount: FieldValue.increment(1),
      });
      logger.info(`Successfully incremented offerCount for task: ${taskId}`);
    } catch (error) {
      logger.error(
        `Failed to increment offerCount for task: ${taskId}`,
        error
      );
    }
  }
);

/**
 * Cloud Function to decrease the offerCount on a task when an offer is deleted.
 */
exports.decrementOfferCount = onDocumentDeleted(
  "tasks/{taskId}/offers/{offerId}",
  async (event) => {
    logger.info("Offer deletion detected, decrementing offer count.");

    const taskId = event.params.taskId;
    const taskRef = db.doc(`tasks/${taskId}`);

    try {
      // Atomically decrement the offerCount field
      await taskRef.update({
        offerCount: FieldValue.increment(-1),
      });
      logger.info(`Successfully decremented offerCount for task: ${taskId}`);
    } catch (error) {
      logger.error(
        `Failed to decrement offerCount for task: ${taskId}`,
        error
      );
    }
  }
);


exports.completeTask = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in to complete a task.');
    }

    const { taskId } = request.data;
    const clientId = request.auth.uid;

    if (!taskId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "taskId".');
    }

    try {
        await db.runTransaction(async (transaction) => {
            const taskRef = db.doc(`tasks/${taskId}`);
            const settingsRef = db.doc('settings/platform');
            
            // --- Perform all reads first ---
            const taskDoc = await transaction.get(taskRef);
            const settingsDoc = await transaction.get(settingsRef);

            if (!taskDoc.exists) {
                throw new HttpsError('not-found', 'Task not found.');
            }

            const taskData = taskDoc.data();
            if (!taskData) {
                throw new HttpsError('internal', 'Task data is missing.');
            }
             if (!taskData.assignedToId) {
                throw new HttpsError('failed-precondition', 'Task has no one assigned to it.');
            }

            const taskerRef = db.doc(`users/${taskData.assignedToId}`);
            const taskerDoc = await transaction.get(taskerRef);

            // --- Validate data from reads ---
            if (taskData.postedById !== clientId) {
                throw new HttpsError('permission-denied', 'You are not the owner of this task.');
            }
            
            if (taskData.status !== 'assigned' && taskData.status !== 'pending-completion') {
                 throw new HttpsError('failed-precondition', `Task cannot be completed from its current state: ${taskData.status}`);
            }

            if (!taskerDoc.exists) {
                throw new HttpsError('not-found', 'Tasker not found.');
            }

            // --- All reads are done and validated. Now, perform calculations and writes. ---
            const commissionRate = settingsDoc.exists() ? (settingsDoc.data()?.commissionRate ?? 0.1) : 0.1;
            const taskPrice = taskData.price;
            const commission = taskPrice * commissionRate;
            const taskerPayout = taskPrice - commission;
            
            // 1. Update task status
            transaction.update(taskRef, { status: 'completed' });

            // 2. Update tasker's wallet
            transaction.update(taskerRef, { 'wallet.balance': FieldValue.increment(taskerPayout) });
            
            // 3. Add transaction record for tasker
            const taskerTransactionRef = db.collection(`users/${taskData.assignedToId}/transactions`).doc();
            transaction.set(taskerTransactionRef, {
                amount: taskerPayout,
                type: 'earning',
                description: `Earning from task: ${taskData.title}`,
                taskId: taskId,
                timestamp: FieldValue.serverTimestamp(),
            });

            // 4. Add transaction record for platform
            const platformTransactionRef = db.collection('platform_transactions').doc();
            transaction.set(platformTransactionRef, {
                amount: commission,
                type: 'commission',
                description: `Commission from task: ${taskData.title}`,
                taskId: taskId,
                taskPrice: taskPrice,
                commissionRate: commissionRate,
                timestamp: FieldValue.serverTimestamp(),
            });
        });

        logger.info(`Task ${taskId} completed successfully by user ${clientId}.`);
        return { success: true };
    } catch (error) {
        logger.error(`Error completing task ${taskId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'An unexpected error occurred while completing the task.');
    }
});

const ensureAdmin = async (uid: string) => {
    const userDoc = await db.doc(`users/${uid}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }
};


exports.processDeposit = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }
    await ensureAdmin(request.auth.uid);

    const { depositId, approve } = request.data;
    if (!depositId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "depositId".');
    }

    const depositRef = db.doc(`deposits/${depositId}`);
    
    try {
        await db.runTransaction(async (transaction) => {
            // --- Phase 1: All Reads ---
            const depositDoc = await transaction.get(depositRef);
            if (!depositDoc.exists) {
                throw new HttpsError('not-found', 'Deposit request not found.');
            }
            const depositData = depositDoc.data();
            if (!depositData || depositData.status !== 'pending') {
                throw new HttpsError('failed-precondition', 'Deposit is not in a pending state.');
            }

            const userRef = db.doc(`users/${depositData.userId}`);
            
            // --- Phase 2: All Writes ---
            if (approve) {
                // Update user's wallet
                transaction.update(userRef, {
                    'wallet.balance': FieldValue.increment(depositData.amount)
                });

                // Create transaction record for user
                const userTransactionRef = db.collection(`users/${depositData.userId}/transactions`).doc();
                transaction.set(userTransactionRef, {
                    amount: depositData.amount,
                    type: 'deposit',
                    description: `Funds deposited via ${depositData.gatewayName}`,
                    timestamp: FieldValue.serverTimestamp(),
                });
                
                // Update deposit status
                transaction.update(depositRef, { status: 'completed', processedAt: FieldValue.serverTimestamp() });
            } else { // Reject
                transaction.update(depositRef, { status: 'rejected', processedAt: FieldValue.serverTimestamp() });
            }
        });

        logger.info(`Deposit ${depositId} has been ${approve ? 'approved' : 'rejected'}`);
        return { success: true };

    } catch (error) {
         logger.error(`Error processing deposit ${depositId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'An unexpected error occurred while processing the deposit.');
    }
});


exports.processWithdrawal = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }
    await ensureAdmin(request.auth.uid);

    const { withdrawalId, approve } = request.data;
     if (!withdrawalId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "withdrawalId".');
    }

    const withdrawalRef = db.doc(`withdrawals/${withdrawalId}`);
    
    try {
        await db.runTransaction(async (transaction) => {
            // --- Phase 1: All Reads ---
            const withdrawalDoc = await transaction.get(withdrawalRef);
            if (!withdrawalDoc.exists) {
                throw new HttpsError('not-found', 'Withdrawal request not found.');
            }
            const withdrawalData = withdrawalDoc.data();
            if (!withdrawalData || withdrawalData.status !== 'pending') {
                throw new HttpsError('failed-precondition', 'Withdrawal is not in a pending state.');
            }

            const userRef = db.doc(`users/${withdrawalData.userId}`);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                 throw new HttpsError('not-found', 'User not found.');
            }
            const userData = userDoc.data();

            // --- Phase 2: All Writes ---
            if (approve) {
                if ((userData?.wallet?.balance ?? 0) < withdrawalData.amount) {
                    transaction.update(withdrawalRef, { 
                        status: 'rejected', 
                        processedAt: FieldValue.serverTimestamp(),
                        rejectionReason: 'Insufficient funds'
                    });
                } else {
                    // Update user's wallet
                    transaction.update(userRef, {
                        'wallet.balance': FieldValue.increment(-withdrawalData.amount)
                    });
                    
                    // Create transaction record for user
                    const userTransactionRef = db.collection(`users/${withdrawalData.userId}/transactions`).doc();
                    transaction.set(userTransactionRef, {
                        amount: -withdrawalData.amount,
                        type: 'withdrawal',
                        description: `Funds withdrawn to ${withdrawalData.method}`,
                        timestamp: FieldValue.serverTimestamp(),
                    });
                    
                    // Update withdrawal status
                    transaction.update(withdrawalRef, { status: 'completed', processedAt: FieldValue.serverTimestamp() });
                }
            } else { // Reject
                transaction.update(withdrawalRef, { status: 'rejected', processedAt: FieldValue.serverTimestamp() });
            }
        });

        logger.info(`Withdrawal ${withdrawalId} has been processed.`);
        return { success: true };

    } catch (error) {
         logger.error(`Error processing withdrawal ${withdrawalId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'An unexpected error occurred while processing the withdrawal.');
    }
});
