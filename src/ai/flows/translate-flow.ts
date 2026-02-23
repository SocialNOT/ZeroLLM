
'use server';
/**
 * @fileOverview A Translation Genkit flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The language to translate into.'),
});
export type TranslateInput = z.infer<typeof TranslateInputSchema>;

const TranslateOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateOutput = z.infer<typeof TranslateOutputSchema>;

export const translateFlow = ai.defineFlow(
  {
    name: 'translateFlow',
    inputSchema: TranslateInputSchema,
    outputSchema: TranslateOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      prompt: `Translate the following text into ${input.targetLanguage}. Provide ONLY the translation.

Text: ${input.text}`,
    });

    return {
      translatedText: text || 'Translation failed.',
    };
  }
);

export async function translateText(input: TranslateInput): Promise<TranslateOutput> {
  return translateFlow(input);
}
