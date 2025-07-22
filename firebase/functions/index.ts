/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/document";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentCreated, onDocumentDeleted, onDocumentWritten } from "firebase-functions/v2/firestore";
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

            const taskDoc = await transaction.get(taskRef);
            const settingsDoc = await transaction.get(settingsRef);

            if (!taskDoc.exists) {
                throw new HttpsError('not-found', 'Task not found.');
            }

            const taskData = taskDoc.data();
            if (!taskData) {
                throw new HttpsError('internal', 'Task data is missing.');
            }

            if (taskData.postedById !== clientId) {
                throw new HttpsError('permission-denied', 'You are not the owner of this task.');
            }
            
            if (taskData.status !== 'assigned' && taskData.status !== 'pending-completion') {
                 throw new HttpsError('failed-precondition', `Task cannot be completed from its current state: ${taskData.status}`);
            }

            if (!taskData.assignedToId) {
                throw new HttpsError('failed-precondition', 'Task has no one assigned to it.');
            }

            const commissionRate = settingsDoc.exists ? (settingsDoc.data()?.commissionRate ?? 0.1) : 0.1;
            const taskPrice = taskData.price;
            const commission = taskPrice * commissionRate;
            const taskerPayout = taskPrice - commission;
            
            const taskerRef = db.doc(`users/${taskData.assignedToId}`);
            const taskerDoc = await transaction.get(taskerRef);

            if (!taskerDoc.exists) {
                throw new HttpsError('not-found', 'Tasker not found.');
            }
            
            // --- All reads are done. Now, perform writes. ---

            // 1. Update task status
            transaction.update(taskRef, { status: 'completed' });

            // 2. Update tasker's wallet
            const taskerData = taskerDoc.data();
            const currentTaskerBalance = taskerData?.wallet?.balance ?? 0;
            const newTaskerBalance = currentTaskerBalance + taskerPayout;
            transaction.update(taskerRef, { 'wallet.balance': newTaskerBalance });
            
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
