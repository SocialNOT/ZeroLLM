/**
 * Utility for interacting with local/remote LLM engine APIs (Ollama, LM Studio, etc.)
 * based on OpenAI-compatible endpoints.
 */

export interface LLMModel {
  id: string;
  object: string;
  owned_by: string;
}

export async function testConnection(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

export async function fetchModels(baseUrl: string): Promise<LLMModel[]> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    // Some providers return data directly, others wrap in { data: [...] }
    return Array.isArray(data) ? data : (data.data || []);
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
}
