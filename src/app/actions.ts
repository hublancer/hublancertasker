'use server';

import {
  generateTaskDescription as generateTaskDescriptionFlow,
  type GenerateTaskDescriptionInput,
} from '@/ai/flows/generate-task-description';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, runTransaction, serverTimestamp, getDoc, updateDoc, writeBatch, FieldValue } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function generateTaskDescription(
  input: GenerateTaskDescriptionInput
): Promise<string> {
  try {
    const result = await generateTaskDescriptionFlow(input);
    return result.taskDescription;
  } catch (error) {
    console.error('Error generating task description:', error);
    return "Sorry, we couldn't generate a description at this time. Please try again later.";
  }
}

interface MakeOfferInput {
    taskId: string;
    taskerId: string;
    taskerName: string;
    taskerAvatar: string;
    offerPrice: number;
    comment: string;
    postedById: string;
    taskTitle: string;
}

export async function makeOffer(input: MakeOfferInput): Promise<{success: boolean, error?: string}> {
    try {
        const offersCollectionRef = collection(db, 'tasks', input.taskId, 'offers');
        await addDoc(offersCollectionRef, {
            taskerId: input.taskerId,
            taskerName: input.taskerName,
            taskerAvatar: input.taskerAvatar,
            offerPrice: input.offerPrice,
            comment: input.comment,
            createdAt: serverTimestamp(),
        });

         await addDoc(collection(db, 'users', input.postedById, 'notifications'), {
            message: `${input.taskerName} made an offer on your task "${input.taskTitle}"`,
            link: `/task/${input.taskId}`,
            read: false,
            createdAt: serverTimestamp()
        });
        
        revalidatePath(`/task/${input.taskId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error making offer:', error);
        return { success: false, error: error.message };
    }
}

export async function completeTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await runTransaction(db, async (transaction) => {
        const taskRef = doc(db, `tasks/${taskId}`);
        const taskDoc = await transaction.get(taskRef);

        if (!taskDoc.exists()) {
            throw new Error('Task not found.');
        }

        const taskData = taskDoc.data();
        if (taskData.status !== 'assigned' && taskData.status !== 'pending-completion') {
            throw new Error(`Task cannot be completed from its current state: ${taskData.status}`);
        }
        
        if (!taskData.assignedToId) {
            throw new Error('Task has no one assigned to it.');
        }

        const settingsRef = doc(db, 'settings/platform');
        const taskerRef = doc(db, `users/${taskData.assignedToId}`);
        
        const [settingsDoc, taskerDoc] = await Promise.all([
            transaction.get(settingsRef),
            transaction.get(taskerRef)
        ]);

        if (!taskerDoc.exists) {
            throw new Error('Tasker not found.');
        }
        
        const commissionRate = settingsDoc.exists() ? (settingsDoc.data()?.commissionRate ?? 0.1) : 0.1;
        const taskPrice = taskData.price;
        const commission = taskPrice * commissionRate;
        const taskerPayout = taskPrice - commission;

        // 1. Update task status
        transaction.update(taskRef, { status: 'completed' });

        // 2. Update tasker's wallet
        transaction.update(taskerRef, { 'wallet.balance': FieldValue.increment(taskerPayout) });
        
        // 3. Add transaction record for tasker
        const taskerTransactionRef = doc(collection(db, `users/${taskData.assignedToId}/transactions`));
        transaction.set(taskerTransactionRef, {
            amount: taskerPayout,
            type: 'earning',
            description: `Earning from task: ${taskData.title}`,
            taskId: taskId,
            timestamp: serverTimestamp(),
        });

        // 4. Add transaction record for platform
        const platformTransactionRef = doc(collection(db, 'platform_transactions'));
        transaction.set(platformTransactionRef, {
            amount: commission,
            type: 'commission',
            description: `Commission from task: ${taskData.title}`,
            taskId: taskId,
            taskPrice: taskPrice,
            commissionRate: commissionRate,
            timestamp: serverTimestamp(),
        });
    });

    console.log(`Task ${taskId} completed successfully.`);
    revalidatePath(`/task/${taskId}`);
    revalidatePath(`/my-tasks`);
    return { success: true };

  } catch (error: any) {
    console.error(`Error completing task ${taskId}:`, error);
    return { success: false, error: error.message };
  }
}

export async function approveDeposit(depositId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, `deposits/${depositId}`);
        const depositDoc = await transaction.get(depositRef);
        
        if (!depositDoc.exists() || depositDoc.data()?.status !== 'pending') {
            throw new Error('Deposit request not found or not pending.');
        }
        const depositData = depositDoc.data();
        const userRef = doc(db, `users/${depositData.userId}`);

        transaction.update(userRef, { 'wallet.balance': FieldValue.increment(depositData.amount) });
        
        const userTransactionRef = doc(collection(db, `users/${depositData.userId}/transactions`));
        transaction.set(userTransactionRef, {
            amount: depositData.amount,
            type: 'deposit',
            description: `Funds deposited via ${depositData.gatewayName}`,
            timestamp: serverTimestamp(),
        });
        
        transaction.update(depositRef, { status: 'completed', processedAt: serverTimestamp() });
    });
    
    revalidatePath('/admin/deposits');
    revalidatePath('/wallet');
    return { success: true };
  } catch (error: any) {
    console.error('Error approving deposit:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectDeposit(depositId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const depositRef = doc(db, 'deposits', depositId);
    await updateDoc(depositRef, { status: 'rejected', processedAt: serverTimestamp() });
    revalidatePath('/admin/deposits');
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting deposit:', error);
    return { success: false, error: error.message };
  }
}

export async function approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await runTransaction(db, async (transaction) => {
            const withdrawalRef = doc(db, `withdrawals/${withdrawalId}`);
            const withdrawalDoc = await transaction.get(withdrawalRef);

            if (!withdrawalDoc.exists() || withdrawalDoc.data()?.status !== 'pending') {
                throw new Error('Withdrawal is not pending or does not exist.');
            }
            const withdrawalData = withdrawalDoc.data();
            const userRef = doc(db, `users/${withdrawalData.userId}`);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error('User not found.');
            }

            if ((userDoc.data()?.wallet?.balance ?? 0) < withdrawalData.amount) {
                // Not enough funds, so reject it within the same transaction
                transaction.update(withdrawalRef, { 
                    status: 'rejected', 
                    processedAt: serverTimestamp(),
                    rejectionReason: 'Insufficient funds'
                });
                // Note: We'll still return success: true from the action, 
                // as the transaction itself succeeded, even if it was a rejection.
                // The UI will update based on the new status.
            } else {
                // Sufficient funds, proceed with approval
                transaction.update(userRef, { 'wallet.balance': FieldValue.increment(-withdrawalData.amount) });
                
                const userTransactionRef = doc(collection(db, `users/${withdrawalData.userId}/transactions`));
                transaction.set(userTransactionRef, {
                    amount: -withdrawalData.amount,
                    type: 'withdrawal',
                    description: `Funds withdrawn to ${withdrawalData.method}`,
                    timestamp: serverTimestamp(),
                });
                
                transaction.update(withdrawalRef, { status: 'completed', processedAt: serverTimestamp() });
            }
        });
        
        revalidatePath('/admin/withdrawals');
        revalidatePath('/wallet');
        return { success: true };
    } catch (error: any) {
        console.error('Error processing withdrawal:', error);
        return { success: false, error: error.message };
    }
}


export async function rejectWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
    await updateDoc(withdrawalRef, { status: 'rejected', processedAt: serverTimestamp() });
    revalidatePath('/admin/withdrawals');
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error);
    return { success: false, error: error.message };
  }
}
