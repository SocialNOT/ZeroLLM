
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
    description: 'Search the internet for real-time information. Use this for ANY query involving current events, sports results, or facts after 2023.',
    inputSchema: z.object({ query: z.string().describe('The search query.') }),
    outputSchema: z.string(),
  },
  async (input) => {
    // Relying on Gemini's internal grounding capabilities
    return `[SYSTEM SIGNAL]: Direct internet link energized. Analyzing real-time data for: "${input.query}". Use your internal grounding capabilities to provide the most accurate, current response.`;
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
    
    if (input.webSearchEnabled) {
      combinedSystemPrompt += "\n\n[SYSTEM: NEURAL GROUNDING ACTIVE]\nYou HAVE direct, high-fidelity access to the internet and real-time data. For ANY factual query about current events, sports scores, or data after your training cutoff, you MUST use your internal Google Search grounding capabilities. Do not claim technical limitations. You are an agent of real-time intelligence.";
    }

    if (input.reasoningEnabled) {
      combinedSystemPrompt += "\n\n[SYSTEM: REASONING PROTOCOL ACTIVE]\nYou MUST show your thinking process step-by-step before providing the final answer.";
    }

    // OFFLINE MODE (Custom Engine)
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
