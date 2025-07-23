'use server';

import {
  generateTaskDescription as generateTaskDescriptionFlow,
  type GenerateTaskDescriptionInput,
} from '@/ai/flows/generate-task-description';
import { db } from '@/lib/firebase-admin'; // Use admin db for server actions
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

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
        const offersCollectionRef = db.collection('tasks').doc(input.taskId).collection('offers');
        await offersCollectionRef.add({
            taskerId: input.taskerId,
            taskerName: input.taskerName,
            taskerAvatar: input.taskerAvatar,
            offerPrice: input.offerPrice,
            comment: input.comment,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        await db.collection('users').doc(input.postedById).collection('notifications').add({
            message: `${input.taskerName} made an offer on your task "${input.taskTitle}"`,
            link: `/task/${input.taskId}`,
            read: false,
            createdAt: FieldValue.serverTimestamp()
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
    const taskRef = db.doc(`tasks/${taskId}`);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
        throw new Error('Task not found.');
    }
    const taskData = taskDoc.data()!;
    
    if (taskData.status !== 'assigned' && taskData.status !== 'pending-completion') {
        throw new Error(`Task cannot be completed from its current state: ${taskData.status}`);
    }
    if (!taskData.assignedToId) {
        throw new Error('Task has no one assigned to it.');
    }

    const settingsRef = db.doc('settings/platform');
    const taskerRef = db.doc(`users/${taskData.assignedToId}`);
    
    const settingsDoc = await settingsRef.get();
    const commissionRate = settingsDoc.exists() ? (settingsDoc.data()?.commissionRate ?? 0.1) : 0.1;
    const taskPrice = taskData.price;
    const commission = taskPrice * commissionRate;
    const taskerPayout = taskPrice - commission;

    // 1. Update task status
    await taskRef.update({ status: 'completed' });

    // 2. Update tasker's wallet
    await taskerRef.update({ 'wallet.balance': FieldValue.increment(taskerPayout) });
    
    // 3. Add transaction record for tasker
    await db.collection(`users/${taskData.assignedToId}/transactions`).add({
        amount: taskerPayout,
        type: 'earning',
        description: `Earning from task: ${taskData.title}`,
        taskId: taskId,
        timestamp: FieldValue.serverTimestamp(),
    });

    // 4. Add transaction record for platform
    await db.collection('platform_transactions').add({
        amount: commission,
        type: 'commission',
        description: `Commission from task: ${taskData.title}`,
        taskId: taskId,
        taskPrice: taskPrice,
        commissionRate: commissionRate,
        timestamp: FieldValue.serverTimestamp(),
    });

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
    const depositRef = db.doc(`deposits/${depositId}`);
    const depositDoc = await depositRef.get();
    
    if (!depositDoc.exists() || depositDoc.data()?.status !== 'pending') {
        throw new Error('Deposit request not found or not pending.');
    }
    const depositData = depositDoc.data()!;
    const userRef = db.doc(`users/${depositData.userId}`);

    // Add funds to user wallet
    await userRef.update({ 'wallet.balance': FieldValue.increment(depositData.amount) });
    
    // Create transaction record
    await db.collection(`users/${depositData.userId}/transactions`).add({
        amount: depositData.amount,
        type: 'deposit',
        description: `Funds deposited via ${depositData.gatewayName}`,
        timestamp: FieldValue.serverTimestamp(),
    });
    
    // Update deposit status
    await depositRef.update({ status: 'completed', processedAt: FieldValue.serverTimestamp() });
    
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
    const depositRef = db.doc('deposits', depositId);
    await depositRef.update({ status: 'rejected', processedAt: FieldValue.serverTimestamp() });
    
    revalidatePath('/admin/deposits');
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting deposit:', error);
    return { success: false, error: error.message };
  }
}

export async function approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const withdrawalRef = db.doc(`withdrawals/${withdrawalId}`);
        const withdrawalDoc = await withdrawalRef.get();

        if (!withdrawalDoc.exists() || withdrawalDoc.data()?.status !== 'pending') {
            throw new Error('Withdrawal is not pending or does not exist.');
        }
        const withdrawalData = withdrawalDoc.data()!;
        const userRef = db.doc(`users/${withdrawalData.userId}`);
        const userDoc = await userRef.get();

        if (!userDoc.exists()) {
            throw new Error('User not found.');
        }

        if ((userDoc.data()?.wallet?.balance ?? 0) < withdrawalData.amount) {
            // Not enough funds, so reject it
            await withdrawalRef.update({ 
                status: 'rejected', 
                processedAt: FieldValue.serverTimestamp(),
                rejectionReason: 'Insufficient funds'
            });
            // We are not incrementing wallet balance back because we never deducted it.
            // So we just reject the request.
            toast({
              variant: 'destructive',
              title: 'Withdrawal Rejected',
              description: 'User has insufficient funds.',
            });
             return { success: false, error: 'Insufficient funds.' };
        } else {
            // Sufficient funds, proceed with approval
            await userRef.update({ 'wallet.balance': FieldValue.increment(-withdrawalData.amount) });
            
            await db.collection(`users/${withdrawalData.userId}/transactions`).add({
                amount: -withdrawalData.amount,
                type: 'withdrawal',
                description: `Funds withdrawn to ${withdrawalData.method}`,
                timestamp: FieldValue.serverTimestamp(),
            });
            
            await withdrawalRef.update({ status: 'completed', processedAt: FieldValue.serverTimestamp() });
        }
        
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
    const withdrawalRef = db.doc('withdrawals', withdrawalId);
    await withdrawalRef.update({ status: 'rejected', processedAt: FieldValue.serverTimestamp() });
    
    revalidatePath('/admin/withdrawals');
    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error);
    return { success: false, error: error.message };
  }
}
