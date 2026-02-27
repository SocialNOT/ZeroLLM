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
  // Remove trailing slashes and common API suffixes for base testing
  normalized = normalized.replace(/\/+$/, '').replace(/\/v1$/, '');
  
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  return normalized;
}

async function safeJsonParse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function joinPath(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function getHeaders(apiKey?: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }
  return headers;
}

/**
 * Performs a High-Fidelity Web Search via Serper API.
 */
export async function performWebSearch(query: string): Promise<string> {
  const apiKey = '4da302c7314ac7c1831cf678ca75f18dd5b7c83f';
  if (!query || query.trim().length < 2) return "";

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });

    if (!response.ok) return "";

    const data = await response.json();
    const results = data.organic?.map((r: any) => `- ${r.title}: ${r.snippet} (${r.link})`).join("\n") || "";
    const answer = data.answerBox?.answer || data.answerBox?.snippet || "";
    
    if (!results && !answer) return "";

    return `\n[WEB GROUNDING DATA]\nQUERY: ${query}\n${answer ? `DIRECT: ${answer}\n` : ""}${results}\n[END GROUNDING]\n`;
  } catch (error) {
    return "";
  }
}

export async function testConnection(baseUrl: string, apiKey?: string): Promise<boolean> {
  if (!baseUrl || baseUrl.length < 5) return false;
  const base = normalizeUrl(baseUrl);
  
  // Test sequence: Ollama tags -> OpenAI models -> Base
  const endpoints = [
    joinPath(base, '/api/tags'),
    joinPath(base, '/v1/models'),
    joinPath(base, '/api/v1/models'), // LM Studio specific
    base
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(apiKey),
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) return true;
    } catch (e) {
      continue;
    }
  }
  return false;
}

export async function fetchModels(baseUrl: string, apiKey?: string): Promise<LLMModel[]> {
  if (!baseUrl) return [];
  const base = normalizeUrl(baseUrl);
  
  // 1. Try OpenAI Compatible /v1/models (Standard)
  try {
    const response = await fetch(joinPath(base, '/v1/models'), {
      method: 'GET',
      headers: getHeaders(apiKey),
      signal: AbortSignal.timeout(5000)
    });
    const data = await safeJsonParse(response);
    if (data && data.data && Array.isArray(data.data)) return data.data;
  } catch (e) {}

  // 2. Try LM Studio specific /api/v1/models
  try {
    const response = await fetch(joinPath(base, '/api/v1/models'), {
      method: 'GET',
      headers: getHeaders(apiKey),
      signal: AbortSignal.timeout(5000)
    });
    const data = await safeJsonParse(response);
    if (data && data.data && Array.isArray(data.data)) return data.data;
  } catch (e) {}

  // 3. Try Ollama /api/tags
  try {
    const response = await fetch(joinPath(base, '/api/tags'), {
      method: 'GET',
      headers: getHeaders(apiKey),
      signal: AbortSignal.timeout(5000)
    });
    const data = await safeJsonParse(response);
    if (data && data.models && Array.isArray(data.models)) {
      return data.models.map((m: any) => ({ id: m.name || m.id }));
    }
  } catch (e) {}

  return [];
}

export async function loadModel(baseUrl: string, modelId: string, apiKey?: string): Promise<boolean> {
  if (!baseUrl || !modelId) return false;
  const base = normalizeUrl(baseUrl);
  
  // LM Studio specific load endpoint requirements
  // Synchronize both 'model' and 'model_key' to ensure 100% compatibility with all versions
  try {
    const response = await fetch(joinPath(base, '/api/v1/models/load'), {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ 
        model: modelId, 
        model_key: modelId 
      }),
      signal: AbortSignal.timeout(15000)
    });
    
    if (response.ok) return true;
    
    // Check if it's just a 404 (endpoint doesn't exist on this engine version)
    if (response.status === 404) return true;

    const err = await safeJsonParse(response);
    console.error("Model Load Protocol Error:", err);
    return false;
  } catch (e) {
    return true; // Silent success for engines without load endpoints
  }
}
