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
 * Supports both HTTP and HTTPS for local/remote self-hosted engines.
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
 * Returns null if the response is not valid JSON instead of throwing.
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

/**
 * Constructs a clean API path without double slashes.
 */
function joinPath(base: string, path: string): string {
  const normalizedBase = normalizeUrl(base);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If base already contains /v1, don't double add it if the path includes it
  if (normalizedBase.endsWith('/v1') && cleanPath.startsWith('/v1')) {
    return `${normalizedBase.substring(0, normalizedBase.length - 3)}${cleanPath}`;
  }
  
  return `${normalizedBase}${cleanPath}`;
}

export async function testConnection(baseUrl: string): Promise<boolean> {
  const url = joinPath(baseUrl, baseUrl.includes('/v1') ? '/models' : '/v1/models');
  
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
  const url = joinPath(baseUrl, baseUrl.includes('/v1') ? '/models' : '/v1/models');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) return [];
    
    const data = await safeJsonParse(response);
    if (!data) return [];
    
    // Support standard OpenAI format
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((m: any) => ({ id: m.id, name: m.id }));
    }
    // Support some older or custom provider formats
    if (data.models && Array.isArray(data.models)) {
      return data.models.map((m: any) => ({ id: m.name, name: m.name }));
    }
  } catch (error) {
    // Fail silently for model discovery
  }
  return [];
}

/**
 * Triggers a model load on the backend if supported (e.g. LM Studio)
 */
export async function loadModel(baseUrl: string, modelId: string): Promise<boolean> {
  // LM Studio specific endpoint usually sits alongside /v1
  const normalizedBase = normalizeUrl(baseUrl);
  const url = joinPath(normalizedBase.replace(/\/v1$/, ''), '/api/v1/models/load');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_key: modelId }),
      mode: 'cors'
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any) {
  const chatUrl = joinPath(baseUrl, baseUrl.includes('/v1') ? '/chat/completions' : '/v1/chat/completions');
  
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
    const errorMessage = errorData?.error?.message || errorData?.message || `Engine Error (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await safeJsonParse(response);
  if (!data) throw new Error('Engine returned an invalid response format (Expected JSON).');
  
  return data.choices?.[0]?.message?.content || "Engine produced an empty response.";
}