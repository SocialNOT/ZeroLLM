/**
 * Utility for interacting with local/remote LLM engine APIs (Ollama, LM Studio, etc.)
 * based on OpenAI-compatible or provider-specific endpoints.
 */

export interface LLMModel {
  id: string;
  name?: string;
  object?: string;
  owned_by?: string;
}

/**
 * Normalizes the base URL to ensure it has a protocol and correct slashes.
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  return normalized.replace(/\/+$/, '');
}

/**
 * Safely parses JSON from a response, checking the content type first.
 */
async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }
  
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

export async function testConnection(baseUrl: string): Promise<boolean> {
  const normalizedBase = normalizeUrl(baseUrl);
  const url = normalizedBase.endsWith('/v1') ? `${normalizedBase}/models` : `${normalizedBase}/v1/models`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    });
    
    return response.ok;
  } catch (e) {
    return false;
  }
}

export async function fetchModels(baseUrl: string): Promise<LLMModel[]> {
  const normalizedBase = normalizeUrl(baseUrl);
  const url = normalizedBase.endsWith('/v1') ? `${normalizedBase}/models` : `${normalizedBase}/v1/models`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) return [];
    
    const data = await safeJsonParse(response);
    if (!data) return [];
    
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((m: any) => ({ id: m.id, name: m.id }));
    }
    if (data.models && Array.isArray(data.models)) {
      return data.models.map((m: any) => ({ id: m.name, name: m.name }));
    }
  } catch (error) {
    console.error('Fetch models failed', error);
  }
  return [];
}

/**
 * Triggers a model load on the backend if supported (e.g. LM Studio)
 */
export async function loadModel(baseUrl: string, modelId: string): Promise<boolean> {
  const normalizedBase = normalizeUrl(baseUrl);
  // LM Studio specific endpoint
  const url = normalizedBase.replace('/v1', '') + '/api/v1/models/load';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_key: modelId }),
      mode: 'cors'
    });
    return response.ok;
  } catch (e) {
    console.error('Load model failed', e);
    return false;
  }
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any) {
  const normalizedBase = normalizeUrl(baseUrl);
  const chatUrl = normalizedBase.endsWith('/v1') ? `${normalizedBase}/chat/completions` : `${normalizedBase}/v1/chat/completions`;
  
  const body = {
    model: modelId || "default",
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: settings.temperature,
    top_p: settings.topP,
    max_tokens: settings.maxTokens,
    stream: false
  };

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body),
    mode: 'cors'
  });

  if (!response.ok) {
    const errorData = await safeJsonParse(response);
    const errorMessage = errorData?.error?.message || errorData?.message || 'Engine error';
    throw new Error(errorMessage);
  }

  const data = await safeJsonParse(response);
  if (!data) throw new Error('Invalid JSON response from engine');
  
  return data.choices?.[0]?.message?.content || "No response.";
}
