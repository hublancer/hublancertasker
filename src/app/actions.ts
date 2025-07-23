'use server';

import {
  generateTaskDescription as generateTaskDescriptionFlow,
  type GenerateTaskDescriptionInput,
} from '@/ai/flows/generate-task-description';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, runTransaction, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase'; 

const functions = getFunctions(app);
const completeTaskFunction = httpsCallable(functions, 'completeTask');
const processDepositFunction = httpsCallable(functions, 'processDeposit');
const processWithdrawalFunction = httpsCallable(functions, 'processWithdrawal');


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

        return { success: true };
    } catch (error: any) {
        console.error('Error making offer:', error);
        return { success: false, error: error.message };
    }
}

interface CompleteTaskInput {
    taskId: string;
}

export async function completeTask(input: CompleteTaskInput): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await completeTaskFunction({ taskId: input.taskId });
    // The result from a callable function is in result.data
    return result.data as { success: boolean; error?: string };
  } catch (error: any) {
    console.error('Error calling completeTask function:', error);
    return { success: false, error: error.message || 'An unknown error occurred while calling the function.' };
  }
}

export async function approveDeposit(depositId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await processDepositFunction({ depositId, approve: true });
    return result.data as { success: boolean, error?: string };
  } catch (error: any) {
    console.error('Error approving deposit:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}

export async function rejectDeposit(depositId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await processDepositFunction({ depositId, approve: false });
    return result.data as { success: boolean, error?: string };
  } catch (error: any) {
    console.error('Error rejecting deposit:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}

export async function approveWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await processWithdrawalFunction({ withdrawalId, approve: true });
     return result.data as { success: boolean, error?: string };
  } catch (error: any)
   {
    console.error('Error approving withdrawal:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}

export async function rejectWithdrawal(withdrawalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await processWithdrawalFunction({ withdrawalId, approve: false });
    return result.data as { success: boolean, error?: string };
  } catch (error: any) {
     console.error('Error rejecting withdrawal:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
