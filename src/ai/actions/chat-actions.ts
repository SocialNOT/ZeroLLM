'use server';

/**
 * @fileOverview Server Actions for chat-related AI tasks.
 */

import { ai } from '@/ai/genkit';

/**
 * Generates a concise title for a chat session based on the user's first message.
 * This runs on the server to prevent Node.js modules from leaking into the browser.
 */
export async function generateChatTitle(text: string): Promise<string> {
  try {
    const { text: title } = await ai.generate({
      prompt: `Create a concise, professional 3-4 word title for an AI chat session based on this first message: "${text}". Provide ONLY the title text, no quotes or periods.`,
      config: { maxTokens: 10 }
    });
    
    return title?.trim() || text.substring(0, 20) + "...";
  } catch (error) {
    console.error("Title Generation Error:", error);
    // Fallback to a truncated version of the input
    return text.substring(0, 20) + "...";
  }
}
