'use server';

import {
  generateTaskDescription as generateTaskDescriptionFlow,
  type GenerateTaskDescriptionInput,
} from '@/ai/flows/generate-task-description';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

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
