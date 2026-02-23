'use server';
/**
 * @fileOverview A Genkit flow for handling persona-driven chat.
 * 
 * - personaDrivenChat - A function that handles the persona-driven chat process.
 * - PersonaDrivenChatInput - The input type for the personaDrivenChat function.
 * - PersonaDrivenChatOutput - The return type for the personaDrivenChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonaDrivenChatInputSchema = z.object({
  systemPrompt: z.string().describe('The system prompt defining the AI persona.'),
  userMessage: z.string().describe('The user\'s message to the AI.'),
  temperature: z.number().min(0).max(1).default(0.7).describe('Controls the randomness of the output. Lower values mean less random responses.'),
  topP: z.number().min(0).max(1).default(0.95).describe('Controls the diversity of the output. Higher values consider more tokens.'),
  maxTokens: z.number().int().positive().default(1024).describe('The maximum number of tokens to generate in the response.'),
});
export type PersonaDrivenChatInput = z.infer<typeof PersonaDrivenChatInputSchema>;

const PersonaDrivenChatOutputSchema = z.string().describe('The AI\'s response based on the persona and user message.');
export type PersonaDrivenChatOutput = z.infer<typeof PersonaDrivenChatOutputSchema>;

export async function personaDrivenChat(input: PersonaDrivenChatInput): Promise<PersonaDrivenChatOutput> {
  return personaDrivenChatFlow(input);
}

const personaDrivenChatPrompt = ai.definePrompt({
  name: 'personaDrivenChatPrompt',
  input: { schema: PersonaDrivenChatInputSchema },
  output: { schema: PersonaDrivenChatOutputSchema },
  prompt: `{{systemPrompt}}

{{userMessage}}`,
});

const personaDrivenChatFlow = ai.defineFlow(
  {
    name: 'personaDrivenChatFlow',
    inputSchema: PersonaDrivenChatInputSchema,
    outputSchema: PersonaDrivenChatOutputSchema,
  },
  async (input) => {
    const { output } = await personaDrivenChatPrompt(input, {
      config: {
        temperature: input.temperature,
        topP: input.topP,
        maxOutputTokens: input.maxTokens,
      },
      system: input.systemPrompt,
    });
    return output!;
  }
);
