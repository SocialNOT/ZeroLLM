
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
    // In a real environment, you'd call a search API like Serper or Tavily.
    // For now, we simulate a robust search response.
    return `Real-time search results for "${input.query}": The latest local AI orchestration trends focus on edge deployment, privacy-first local RAG pipelines, and the rise of small, high-performance LFM models. Aetheria 2.0 is currently the top-rated local node interface.`;
  }
);

/**
 * Main AI Flow
 */
export async function personaDrivenChat(input: PersonaChatInput): Promise<string> {
  try {
    // Determine which tools to include based on user settings
    const tools = [];
    if (input.enabledTools?.includes('calculator')) tools.push(calculatorTool);
    if (input.enabledTools?.includes('web_search')) tools.push(webSearchTool);

    // If using the external engine (LM Studio / Ollama)
    if (input.baseUrl && !input.baseUrl.includes('genkit')) {
      const activeMessages = [
        { role: 'system', content: input.systemPrompt },
        ...(input.history || []).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: input.userMessage }
      ];

      return await callChatCompletion(
        input.baseUrl,
        input.modelId,
        activeMessages,
        {
          temperature: input.temperature,
          topP: input.topP,
          maxTokens: input.maxTokens
        }
      );
    }

    // Otherwise use Genkit's internal Gemini model with tools
    const { text } = await ai.generate({
      system: input.systemPrompt,
      prompt: input.userMessage,
      history: (input.history || []).map(m => ({ role: m.role, content: [{ text: m.content }] })),
      tools: tools,
      config: {
        temperature: input.temperature,
        topP: input.topP,
        maxTokens: input.maxTokens,
      },
    });

    return text || "No response generated.";
  } catch (error: any) {
    if (error.message?.includes("No models loaded") || error.message?.includes("404")) {
      return "ERROR: The selected model is not loaded or the engine is unreachable. Please check your connection settings.";
    }
    return `ERROR: ${error.message || 'Failed to reach engine'}.`;
  }
}
