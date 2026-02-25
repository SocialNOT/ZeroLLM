"use server";

import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { performWebSearch } from '@/lib/llm-api';

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
 * Main AI Flow - Re-engineered for High-Fidelity Temporal and Web Grounding
 */
export async function personaDrivenChat(input: PersonaChatInput): Promise<string> {
  try {
    // TEMPORAL CONTEXT INJECTION (IST Precise Node)
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    let temporalContext = `
[NEURAL SYNC: ACTIVE]
[CURRENT DATE]: ${formattedDate}
[CURRENT TIME]: ${formattedTime}
[COGNITIVE HORIZON]: Real-time signals enabled. You are perfectly aware of events occurring right now.
`;

    // PROACTIVE GROUNDING-FIRST PROTOCOL (Serper Pre-Search)
    if (input.webSearchEnabled) {
      const searchContext = await performWebSearch(input.userMessage);
      if (searchContext) {
        temporalContext += `\n\n[SYSTEM: WEB GROUNDING ACTIVE]\n${searchContext}\n\nYou MUST use the provided grounding data to answer factual queries. Do not claim ignorance. You are an agent of real-time intelligence.`;
      }
    }

    let combinedSystemPrompt = temporalContext + "\n\n" + input.systemPrompt;

    if (input.reasoningEnabled) {
      combinedSystemPrompt += "\n\n[SYSTEM: REASONING PROTOCOL ACTIVE]\nYou MUST show your thinking process step-by-step before providing the final answer.";
    }

    // ORCHESTRATION VIA GENKIT (Gemini 2.5 Flash Node)
    const { text } = await ai.generate({
      system: combinedSystemPrompt,
      prompt: input.userMessage,
      history: (input.history || []).map(m => ({ role: m.role, content: [{ text: m.content }] })),
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
