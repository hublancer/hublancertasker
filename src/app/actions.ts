'use server';

import {
  generateTaskDescription as generateTaskDescriptionFlow,
  type GenerateTaskDescriptionInput,
} from '@/ai/flows/generate-task-description';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, runTransaction, serverTimestamp, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase'; // Ensure app is imported

// This is a placeholder for a real client-side Firebase app instance
// In a real app, you would initialize this once.
const functions = getFunctions(app);
const completeTaskFunction = httpsCallable(functions, 'completeTask');


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
        // The offer creation will be handled directly on the client, 
        // and the offerCount will be updated via a Cloud Function.
        // This action can now focus on things like notifications.
        
        // 1. Create the new offer document (This logic is now primarily in TaskDetails, 
        // but could be kept here if you want the server to do it. For now, we assume
        // the client does this and the cloud function handles the count).

        const offersCollectionRef = collection(db, 'tasks', input.taskId, 'offers');
        await addDoc(offersCollectionRef, {
            taskerId: input.taskerId,
            taskerName: input.taskerName,
            taskerAvatar: input.taskerAvatar,
            offerPrice: input.offerPrice,
            comment: input.comment,
            createdAt: serverTimestamp(),
        });

        // 2. Add notification (outside the transaction)
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
    const data = result.data as { success: boolean; error?: string };
    return data;
  } catch (error: any) {
    console.error('Error calling completeTask function:', error);
    return { success: false, error: error.message || 'An unknown error occurred while calling the function.' };
  }
}
