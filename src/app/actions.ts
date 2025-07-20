'use server';

import {
  generateTaskDescription as generateTaskDescriptionFlow,
  type GenerateTaskDescriptionInput,
} from '@/ai/flows/generate-task-description';

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
