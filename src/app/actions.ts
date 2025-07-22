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
        await runTransaction(db, async (transaction) => {
            const taskRef = doc(db, 'tasks', input.taskId);
            const taskDoc = await transaction.get(taskRef);

            if (!taskDoc.exists()) {
                throw new Error("Task does not exist!");
            }
            
            // 1. Create the new offer document
            const newOfferRef = doc(collection(db, 'tasks', input.taskId, 'offers'));
            transaction.set(newOfferRef, {
                taskerId: input.taskerId,
                taskerName: input.taskerName,
                taskerAvatar: input.taskerAvatar,
                offerPrice: input.offerPrice,
                comment: input.comment,
                createdAt: serverTimestamp(),
            });

            // 2. Update the offer count on the task
            const newOfferCount = (taskDoc.data().offerCount || 0) + 1;
            transaction.update(taskRef, { offerCount: newOfferCount });
        });

        // 3. Add notification (outside the transaction)
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
