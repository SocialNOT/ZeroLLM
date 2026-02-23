
'use server';
/**
 * @fileOverview A Genkit flow for handling advanced persona-driven chat with memory and tools.
 * 
 * - personaDrivenChat - A function that handles the persona-driven chat process.
 * - PersonaDrivenChatInput - The input type for the personaDrivenChat function.
 * - PersonaDrivenChatOutput - The return type for the personaDrivenChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number(),
});

const PersonaDrivenChatInputSchema = z.object({
  systemPrompt: z.string().describe('The system prompt defining the AI persona.'),
  userMessage: z.string().describe('The user\'s message to the AI.'),
  temperature: z.number().min(0).max(1).default(0.7),
  topP: z.number().min(0).max(1).default(0.95),
  maxTokens: z.number().int().positive().default(1024),
  memoryType: z.enum(['buffer', 'summary', 'knowledge-graph']).default('buffer'),
  enabledTools: z.array(z.string()).default([]),
  history: z.array(MessageSchema).optional(),
});
export type PersonaDrivenChatInput = z.infer<typeof PersonaDrivenChatInputSchema>;

const PersonaDrivenChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s generated response text.')
});
export type PersonaDrivenChatOutput = z.infer<typeof PersonaDrivenChatOutputSchema>;

// Tool definitions
const calculatorTool = ai.defineTool(
  {
    name: 'calculator',
    description: 'Perform basic math operations.',
    inputSchema: z.object({ expression: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      // Basic safe eval placeholder
      return `Result: ${eval(input.expression.replace(/[^-()\d/*+.]/g, ''))}`;
    } catch (e) {
      return "Error evaluating expression.";
    }
  }
);

const webSearchTool = ai.defineTool(
  {
    name: 'web_search',
    description: 'Search the internet.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `Simulated search results for: ${input.query}. Knowledge cutoff: real-time. Results: Aetheria Enterprise version 2.5 released with local RAG support.`;
  }
);

/**
 * Public wrapper for the persona-driven chat flow.
 * Returns only the response text for easier UI integration.
 */
export async function personaDrivenChat(input: PersonaDrivenChatInput): Promise<string> {
  const result = await personaDrivenChatFlow(input);
  return result.response;
}

const personaDrivenChatPrompt = ai.definePrompt({
  name: 'personaDrivenChatPrompt',
  input: { schema: PersonaDrivenChatInputSchema },
  output: { schema: PersonaDrivenChatOutputSchema },
  system: '{{systemPrompt}}',
  prompt: `Memory Type: {{memoryType}}
{{#if history}}
Recent Context:
{{#each history}}
{{role}}: {{{content}}}
{{/each}}
{{/if}}

User: {{userMessage}}`,
});

const personaDrivenChatFlow = ai.defineFlow(
  {
    name: 'personaDrivenChatFlow',
    inputSchema: PersonaDrivenChatInputSchema,
    outputSchema: PersonaDrivenChatOutputSchema,
  },
  async (input) => {
    const activeTools = [];
    if (input.enabledTools.includes('calculator')) activeTools.push(calculatorTool);
    if (input.enabledTools.includes('web_search')) activeTools.push(webSearchTool);

    const { output } = await personaDrivenChatPrompt(input, {
      tools: activeTools,
      config: {
        temperature: input.temperature,
        topP: input.topP,
        maxOutputTokens: input.maxTokens,
      },
    });

    if (!output) {
      return { response: "I'm sorry, I encountered an issue while generating a response. The engine might be temporarily busy or restricted by safety filters." };
    }

    return output;
  }
);
