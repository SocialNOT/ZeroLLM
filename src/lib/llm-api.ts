/**
 * Professional LLM Utility for local/remote engine interactions.
 * Optimized for server-side execution to bypass browser CORS/Mixed Content.
 */

export interface LLMModel {
  id: string;
  name?: string;
  object?: string;
}

function normalizeUrl(url: string): string {
  if (!url) return '';
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
  
  // Prevent double v1 slashes or accidental double slashes
  const fullUrl = `${normalizedBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
  return fullUrl;
}

export async function testConnection(baseUrl: string): Promise<boolean> {
  if (!baseUrl || baseUrl.length < 5) return false;
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Try common status endpoints
  const endpoints = [
    joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/models' : '/v1/models'),
    normalizedBase
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) return true;
    } catch (e) {}
  }
  return false;
}

export async function fetchModels(baseUrl: string): Promise<LLMModel[]> {
  if (!baseUrl) return [];
  const normalizedBase = normalizeUrl(baseUrl);
  const url = joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/models' : '/v1/models');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    const data = await safeJsonParse(response);
    if (!data) return [];
    
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.models && Array.isArray(data.models)) return data.models.map((m: any) => ({ id: m.name || m.id }));
    if (Array.isArray(data)) return data.map((m: any) => ({ id: m.id || m.name }));
  } catch (e) {}
  return [];
}

export async function loadModel(baseUrl: string, modelId: string): Promise<boolean> {
  if (!baseUrl || !modelId) return false;
  const base = normalizeUrl(baseUrl).replace(/\/v1$/, '');
  const loadUrl = joinPath(base, '/api/v1/models/load');
  
  try {
    const response = await fetch(loadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_key: modelId })
    });
    return response.ok;
  } catch (e) {
    return true; // Fallback for servers that don't have explicit load endpoint
  }
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any) {
  if (!baseUrl) throw new Error("No engine URL provided.");
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
    })
  });

  if (!response.ok) {
    const errorData = await safeJsonParse(response);
    throw new Error(errorData?.error?.message || `Engine error (${response.status})`);
  }

  const data = await safeJsonParse(response);
  if (!data) throw new Error('Received an incompatible non-JSON response from the server.');
  
  return data.choices?.[0]?.message?.content || "No response produced.";
}
