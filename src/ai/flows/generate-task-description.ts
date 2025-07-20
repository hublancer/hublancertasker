'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a detailed task description based on the task title and other provided information.
 *
 * - generateTaskDescription - A function that takes task details and generates a description.
 * - GenerateTaskDescriptionInput - The input type for the generateTaskDescription function.
 * - GenerateTaskDescriptionOutput - The return type for the generateTaskDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskDescriptionInputSchema = z.object({
  taskTitle: z.string().describe('The title of the task.'),
  taskType: z.string().describe('The type of task (e.g., physical or online).'),
  budget: z.number().describe('The budget for the task.'),
  preferredDateTime: z.string().describe('The preferred date and time for the task.'),
  additionalInfo: z.string().optional().describe('Any additional information about the task.'),
});
export type GenerateTaskDescriptionInput = z.infer<typeof GenerateTaskDescriptionInputSchema>;

const GenerateTaskDescriptionOutputSchema = z.object({
  taskDescription: z.string().describe('A detailed and engaging description of the task.'),
});
export type GenerateTaskDescriptionOutput = z.infer<typeof GenerateTaskDescriptionOutputSchema>;

export async function generateTaskDescription(input: GenerateTaskDescriptionInput): Promise<GenerateTaskDescriptionOutput> {
  return generateTaskDescriptionFlow(input);
}

const generateTaskDescriptionPrompt = ai.definePrompt({
  name: 'generateTaskDescriptionPrompt',
  input: {schema: GenerateTaskDescriptionInputSchema},
  output: {schema: GenerateTaskDescriptionOutputSchema},
  prompt: `You are an AI assistant designed to help clients generate detailed and engaging task descriptions for their posted tasks.

  Based on the following information, create a compelling and informative task description that will attract qualified taskers:

  Task Title: {{{taskTitle}}}
  Task Type: {{{taskType}}}
  Budget: {{{budget}}}
  Preferred Date/Time: {{{preferredDateTime}}}
  Additional Information: {{{additionalInfo}}}

  Task Description:`, 
});

const generateTaskDescriptionFlow = ai.defineFlow(
  {
    name: 'generateTaskDescriptionFlow',
    inputSchema: GenerateTaskDescriptionInputSchema,
    outputSchema: GenerateTaskDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateTaskDescriptionPrompt(input);
    return output!;
  }
);
