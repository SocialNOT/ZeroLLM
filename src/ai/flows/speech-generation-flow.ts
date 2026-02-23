
'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) Genkit flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const SpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
  voice: z.string().optional().default('Algenib'),
});
export type SpeechInput = z.infer<typeof SpeechInputSchema>;

const SpeechOutputSchema = z.object({
  audioUri: z.string().describe('The data URI of the generated audio.'),
});
export type SpeechOutput = z.infer<typeof SpeechOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export const speechFlow = ai.defineFlow(
  {
    name: 'speechFlow',
    inputSchema: SpeechInputSchema,
    outputSchema: SpeechOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voice },
          },
        },
      },
      prompt: input.text,
    });

    if (!media) {
      throw new Error('no media returned from Gemini TTS');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      audioUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

export async function generateSpeech(input: SpeechInput): Promise<SpeechOutput> {
  return speechFlow(input);
}
