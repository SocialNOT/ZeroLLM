'use server';

/**
 * @fileOverview Server Actions for engine orchestration.
 * These actions run on the server to bypass browser CORS and Mixed Content (HTTPS -> HTTP) blocks.
 */

import { testConnection, fetchModels, loadModel } from '@/lib/llm-api';
import { LLMModel } from '@/lib/llm-api';

export async function testConnectionAction(baseUrl: string, apiKey?: string): Promise<boolean> {
  try {
    return await testConnection(baseUrl, apiKey);
  } catch (error) {
    return false;
  }
}

export async function fetchModelsAction(baseUrl: string, apiKey?: string): Promise<LLMModel[]> {
  try {
    return await fetchModels(baseUrl, apiKey);
  } catch (error) {
    return [];
  }
}

export async function loadModelAction(baseUrl: string, modelId: string, apiKey?: string): Promise<boolean> {
  try {
    return await loadModel(baseUrl, modelId, apiKey);
  } catch (error) {
    return false;
  }
}
