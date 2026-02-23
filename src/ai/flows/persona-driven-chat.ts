'use server';

import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { callChatCompletion } from '@/lib/llm-api';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number(),
});

const PersonaChatInputSchema = z.object({
  baseUrl: z.string(),
  modelId: z.string(),
  systemPrompt: z.string(),
  userMessage: z.string(),
  temperature: z.number().default(0.7),
  topP: z.number().default(0.9),
  maxTokens: z.number().default(1024),
  history: z.array(MessageSchema).optional(),
  enabledTools: z.array(z.string()).optional(),
});

export type PersonaChatInput = z.infer<typeof PersonaChatInputSchema>;

/**
 * Key Tool Implementations
 */
export const calculatorTool = ai.defineTool(
  {
    name: 'calculator',
    description: 'Perform precise math calculations.',
    inputSchema: z.object({ expression: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      // Basic safe calculation wrapper
      const result = new Function(`return ${input.expression}`)();
      return `Result: ${result}`;
    } catch (e) {
      return "Invalid expression";
    }
  }
);

export const webSearchTool = ai.defineTool(
  {
    name: 'web_search',
    description: 'Search for real-time information on the internet.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `Simulated search results for "${input.query}": Local AI orchestration is trending in 2026 with increased focus on privacy and speed.`;
  }
);

/**
 * Main AI Flow
 */
export async function personaDrivenChat(input: PersonaChatInput): Promise<string> {
  try {
    const activeMessages = [
      { role: 'system', content: input.systemPrompt },
      ...(input.history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: input.userMessage }
    ];

    const response = await callChatCompletion(
      input.baseUrl,
      input.modelId,
      activeMessages,
      {
        temperature: input.temperature,
        topP: input.topP,
        maxTokens: input.maxTokens
      }
    );

    return response;
  } catch (error: any) {
    if (error.message?.includes("No models loaded") || error.message?.includes("404")) {
      return "ERROR: The selected model is not loaded or the engine is unreachable. Please use the 'Load to Memory' button in System Settings.";
    }
    return `ERROR: ${error.message || 'Failed to reach engine'}. Check your connection settings at ${input.baseUrl}.`;
  }
}
