/**
 * Professional LLM Utility for local/remote engine interactions.
 * Protocol-agnostic and resilient to mixed-content/non-JSON responses.
 */

export interface LLMModel {
  id: string;
  name?: string;
  object?: string;
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  // Ensure protocol exists
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  // Remove trailing slashes
  return normalized.replace(/\/+$/, '');
}

async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // If we get HTML instead of JSON (e.g. 404 page), don't crash the parser
    return null;
  }
  try {
    const text = await response.text();
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function joinPath(base: string, path: string): string {
  const normalizedBase = normalizeUrl(base);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Prevent double v1 slashes
  if (normalizedBase.endsWith('/v1') && cleanPath.startsWith('/v1')) {
    return `${normalizedBase.substring(0, normalizedBase.length - 3)}${cleanPath}`;
  }
  
  return `${normalizedBase}${cleanPath}`;
}

export async function testConnection(baseUrl: string): Promise<boolean> {
  const normalizedBase = normalizeUrl(baseUrl);
  // Try common status endpoints
  const endpoints = [
    joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/models' : '/v1/models'),
    normalizedBase // Root check
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) return true;
    } catch (e) {}
  }
  return false;
}

export async function fetchModels(baseUrl: string): Promise<LLMModel[]> {
  const normalizedBase = normalizeUrl(baseUrl);
  const url = joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/models' : '/v1/models');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      signal: AbortSignal.timeout(5000)
    });
    
    const data = await safeJsonParse(response);
    if (!data) return [];
    
    // Support OpenAI, Ollama, and LM Studio response formats
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.models && Array.isArray(data.models)) return data.models.map((m: any) => ({ id: m.name || m.id }));
    if (Array.isArray(data)) return data.map((m: any) => ({ id: m.id || m.name }));
  } catch (e) {}
  return [];
}

export async function loadModel(baseUrl: string, modelId: string): Promise<boolean> {
  // LM Studio specific load endpoint or standard POST to completions with auto-load
  const base = normalizeUrl(baseUrl).replace(/\/v1$/, '');
  const loadUrl = joinPath(base, '/api/v1/models/load');
  
  try {
    const response = await fetch(loadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_key: modelId }),
      mode: 'cors'
    });
    return response.ok;
  } catch (e) {
    // If specific load fails, just return true and let completion handle it (auto-load)
    return true;
  }
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any) {
  const normalizedBase = normalizeUrl(baseUrl);
  const chatUrl = joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/chat/completions' : '/v1/chat/completions');
  
  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      model: modelId || "default",
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: settings.temperature,
      top_p: settings.topP,
      max_tokens: settings.maxTokens,
      stream: false
    }),
    mode: 'cors'
  });

  if (!response.ok) {
    const errorData = await safeJsonParse(response);
    throw new Error(errorData?.error?.message || `Engine error (${response.status})`);
  }

  const data = await safeJsonParse(response);
  if (!data) throw new Error('Received an incompatible non-JSON response from the server.');
  
  return data.choices?.[0]?.message?.content || "No response produced.";
}
