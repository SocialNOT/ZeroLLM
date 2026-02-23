'use server';
/**
 * @fileOverview A flow for handling persona-driven chat using self-hosted engine backends.
 */

import { z } from 'genkit';
import { callChatCompletion } from '@/lib/llm-api';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number(),
});

const PersonaDrivenChatInputSchema = z.object({
  baseUrl: z.string(),
  modelId: z.string(),
  systemPrompt: z.string().describe('The system prompt defining the AI persona.'),
  userMessage: z.string().describe('The user\'s message to the AI.'),
  temperature: z.number().min(0).max(1).default(0.7),
  topP: z.number().min(0).max(1).default(0.95),
  maxTokens: z.number().int().positive().default(1024),
  history: z.array(MessageSchema).optional(),
});
export type PersonaDrivenChatInput = z.infer<typeof PersonaDrivenChatInputSchema>;

const PersonaDrivenChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s generated response text.')
});
export type PersonaDrivenChatOutput = z.infer<typeof PersonaDrivenChatOutputSchema>;

/**
 * Public wrapper for the persona-driven chat flow.
 * Directly interfaces with the self-hosted LLM backend.
 */
export async function personaDrivenChat(input: PersonaDrivenChatInput): Promise<string> {
  try {
    const messages = [
      { role: 'system', content: input.systemPrompt },
      ...(input.history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: input.userMessage }
    ];

    const response = await callChatCompletion(
      input.baseUrl,
      input.modelId,
      messages,
      {
        temperature: input.temperature,
        topP: input.topP,
        maxTokens: input.maxTokens
      }
    );

    return response;
  } catch (error: any) {
    console.error("Engine failure:", error);
    return `Error: Unable to reach the engine at ${input.baseUrl}. ${error.message}`;
  }
}
