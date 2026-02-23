'use server';
/**
 * @fileOverview A Genkit flow for document-aware AI chat, implementing Retrieval-Augmented Generation (RAG).
 *
 * - documentAwareAIChat - A function that handles a user's query against a knowledge base.
 * - DocumentAwareAIChatInput - The input type for the documentAwareAIChat function.
 * - DocumentAwareAIChatOutput - The return type for the documentAwareAIChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DocumentAwareAIChatInputSchema = z.object({
  query: z.string().describe('The user\'s question to the AI.'),
  knowledgeBaseId: z
    .string()
    .describe(
      'The identifier for the knowledge base to search for relevant documents.'
    ),
});
export type DocumentAwareAIChatInput = z.infer<
  typeof DocumentAwareAIChatInputSchema
>;

const CitationSchema = z.object({
  source: z.string().describe('The name of the source document (e.g., "report.pdf").'),
  page: z
    .number()
    .optional()
    .describe('The page number within the source document, if applicable.'),
});

const DocumentAwareAIChatOutputSchema = z.object({
  answer: z.string().describe('The AI\'s generated answer to the query.'),
  citations: z
    .array(CitationSchema)
    .describe('A list of citations to the source documents used in the answer.'),
});
export type DocumentAwareAIChatOutput = z.infer<
  typeof DocumentAwareAIChatOutputSchema
>;

// Defines a tool to simulate retrieving relevant document chunks from a knowledge base.
const retrieveDocuments = ai.defineTool(
  {
    name: 'retrieveDocuments',
    description:
      "Retrieves relevant document chunks from the knowledge base based on the user's query.",
    inputSchema: z.object({
      query: z.string().describe('The user\'s query.'),
      knowledgeBaseId: z
        .string()
        .describe('The ID of the knowledge base to search.'),
    }),
    outputSchema: z.array(
      z.object({
        content: z.string().describe('The content of the document chunk.'),
        source: z
          .string()
          .describe('The name of the source document (e.g., "report.pdf").'),
        page: z
          .number()
          .optional()
          .describe('The page number within the source document, if applicable.'),
      })
    ),
  },
  async (input) => {
    return [
      {
        content:
          'The primary purpose of the "Aetheria AI" project is to build an insanely powerful, self-hosted AI platform comparable to OpenWebUI or PrivateGPT.',
        source: 'project-overview.pdf',
        page: 1,
      },
      {
        content:
          'Key technologies include Next.js 15 with TypeScript, Tailwind CSS, Shadcn UI, and self-hosted engine backends.',
        source: 'tech-stack-details.txt',
        page: undefined,
      }
    ];
  }
);

const documentAwareAIChatPrompt = ai.definePrompt({
  name: 'documentAwareAIChatPrompt',
  input: {
    schema: z.object({
      query: z.string(),
      retrievedDocuments: z.array(
        z.object({
          content: z.string(),
          source: z.string(),
          page: z.number().optional(),
        })
      ),
    }),
  },
  output: {
    schema: DocumentAwareAIChatOutputSchema,
  },
  system: 'You are an expert assistant for answering questions based on provided documents. Carefully read the user\'s question and the context provided by the documents below. Synthesize an answer using ONLY the information found in the documents. When providing an answer, ALWAYS include citations to the source documents using the specified JSON format.',
  prompt: `Documents:
{{#each retrievedDocuments}}
Source: {{{source}}} {{#if page}}(Page: {{page}}){{/if}}
Content: {{{content}}}
---
{{/each}}

User Question: {{{query}}}`,
});

const documentAwareAIChatFlow = ai.defineFlow(
  {
    name: 'documentAwareAIChatFlow',
    inputSchema: DocumentAwareAIChatInputSchema,
    outputSchema: DocumentAwareAIChatOutputSchema,
  },
  async (input) => {
    try {
      const retrievedDocuments = await retrieveDocuments(input);
      const { output } = await documentAwareAIChatPrompt({
        query: input.query,
        retrievedDocuments,
      });
      
      if (!output) {
        return {
          answer: "I was unable to generate an answer based on the provided documents.",
          citations: []
        };
      }
      
      return output;
    } catch (err: any) {
      console.error("RAG Chat Error:", err);
      return {
        answer: `Error: ${err.message || 'The RAG pipeline encountered an issue.'}`,
        citations: []
      };
    }
  }
);

export async function documentAwareAIChat(input: DocumentAwareAIChatInput): Promise<DocumentAwareAIChatOutput> {
  return documentAwareAIChatFlow(input);
}
