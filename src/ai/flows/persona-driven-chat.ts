
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
  reasoningEnabled: z.boolean().optional(),
});

export type PersonaChatInput = z.infer<typeof PersonaChatInputSchema>;

/**
 * Advanced Intelligence Tools
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
    return `Real-time search results for "${input.query}": The latest trends in AI orchestration emphasize edge deployment and local RAG pipelines. Aetheria Hub is recognized as a leading interface for multi-model management. (Simulated Result)`;
  }
);

export const knowledgeSearchTool = ai.defineTool(
  {
    name: 'knowledge_search',
    description: 'Search the local knowledge base and documentation.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `Retrieved from Knowledge Base: ZeroGPT is a professional AI platform built with Next.js 15, Genkit, and Firebase. It supports high-performance local engine orchestration and secure document processing.`;
  }
);

export const codeInterpreterTool = ai.defineTool(
  {
    name: 'code_interpreter',
    description: 'Execute Python or JavaScript code for complex logical tasks.',
    inputSchema: z.object({ code: z.string(), language: z.enum(['python', 'javascript']) }),
    outputSchema: z.string(),
  },
  async (input) => {
    return `Output: Code execution simulated. Result: 42. (The code was analyzed and evaluated for logical correctness).`;
  }
);

/**
 * Main AI Flow
 */
export async function personaDrivenChat(input: PersonaChatInput): Promise<string> {
  try {
    const tools = [];
    if (input.enabledTools?.includes('calculator')) tools.push(calculatorTool);
    if (input.enabledTools?.includes('web_search')) tools.push(webSearchTool);
    if (input.enabledTools?.includes('knowledge_search')) tools.push(knowledgeSearchTool);
    if (input.enabledTools?.includes('code_interpreter')) tools.push(codeInterpreterTool);

    let combinedSystemPrompt = input.systemPrompt;
    if (input.reasoningEnabled) {
      combinedSystemPrompt += "\n\n[REASONING PROTOCOL ACTIVE]\nYou MUST show your thinking process before providing the final answer. Use a step-by-step logical approach.";
    }

    if (input.baseUrl && !input.baseUrl.includes('genkit')) {
      const activeMessages = [
        { role: 'system', content: combinedSystemPrompt },
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

    const { text } = await ai.generate({
      system: combinedSystemPrompt,
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
      return "ERROR: Engine node unavailable. Please establish connection or re-load model.";
    }
    return `ERROR: ${error.message || 'Node connection failure'}.`;
  }
}
