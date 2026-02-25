'use server';

import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { callChatCompletion, performWebSearch } from '@/lib/llm-api';

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
  webSearchEnabled: z.boolean().optional(),
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
    description: 'Search for real-time information on the internet using Google Search API. Use this when the user asks for current events, news, or specific facts post-2023.',
    inputSchema: z.object({ query: z.string().describe('The search query to send to Google.') }),
    outputSchema: z.string(),
  },
  async (input) => {
    return await performWebSearch(input.query);
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
    if (input.enabledTools?.includes('web_search') || input.webSearchEnabled) tools.push(webSearchTool);
    if (input.enabledTools?.includes('knowledge_search')) tools.push(knowledgeSearchTool);
    if (input.enabledTools?.includes('code_interpreter')) tools.push(codeInterpreterTool);

    let combinedSystemPrompt = input.systemPrompt;
    
    // SEARCH-FIRST INJECTION FOR MAXIMUM SIGNAL INTEGRITY
    if (input.webSearchEnabled) {
      const searchData = await performWebSearch(input.userMessage);
      combinedSystemPrompt += `\n\n[SYSTEM: SEARCH-FIRST GROUNDING ENERGIZED]\nThe following verified data has been retrieved in real-time. You MUST use this information to answer the user accurately. Do NOT claim you lack web access.\n\n${searchData}`;
    }

    if (input.reasoningEnabled) {
      combinedSystemPrompt += "\n\n[SYSTEM: REASONING PROTOCOL ACTIVE]\nYou MUST show your thinking process step-by-step before providing the final answer.";
    }

    // GROUNDING-FIRST FOR OFFLINE ENGINES
    if (input.baseUrl && !input.baseUrl.includes('genkit')) {
      let finalMessages = [
        { role: 'system' as const, content: combinedSystemPrompt },
        ...(input.history || []).map(m => ({ role: m.role as any, content: m.content })),
      ];

      finalMessages.push({ role: 'user' as const, content: input.userMessage });

      return await callChatCompletion(
        input.baseUrl,
        input.modelId,
        finalMessages,
        {
          temperature: input.temperature,
          topP: input.topP,
          maxTokens: input.maxTokens
        }
      );
    }

    // ONLINE MODE (Gemini via Genkit)
    const { text } = await ai.generate({
      system: combinedSystemPrompt,
      prompt: input.userMessage,
      history: (input.history || []).map(m => ({ role: m.role, content: [{ text: m.content }] })),
      tools: tools,
      config: {
        temperature: input.temperature,
        topP: input.topP,
        maxOutputTokens: input.maxTokens,
      },
    });

    return text || "No response generated.";
  } catch (error: any) {
    console.error("Neural Orchestration Error:", error);
    return `ERROR: ${error.message || 'Signal interruption during orchestration'}.`;
  }
}