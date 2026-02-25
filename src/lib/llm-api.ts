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
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
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
  return `${normalizedBase}${cleanPath}`.replace(/([^:]\/)\/+/g, "$1");
}

function getHeaders(apiKey?: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

/**
 * Performs a High-Fidelity Web Search via Serper API.
 * Injects real-time organic results into the cognitive stream.
 */
export async function performWebSearch(query: string): Promise<string> {
  // Using the energized Serper node
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

    if (!response.ok) {
      return `[SIGNAL FAILURE]: Serper node unreachable (${response.status}).`;
    }

    const data = await response.json();
    const results = data.organic?.map((r: any) => `- ${r.title}: ${r.snippet} (${r.link})`).join("\n") || "";
    const answer = data.answerBox?.answer || data.answerBox?.snippet || "";
    
    if (!results && !answer) return "[SYSTEM]: Search returned zero relevant nodes.";

    return `
[REAL-TIME WEB GROUNDING DATA]
QUERY: ${query}
${answer ? `DIRECT ANSWER: ${answer}` : ""}
TOP ORGANIC SOURCES:
${results}
[END GROUNDING DATA]
`;
  } catch (error: any) {
    console.error("Serper Search Error:", error);
    return `[SEARCH ERROR]: Signal interruption during real-time retrieval.`;
  }
}

export async function testConnection(baseUrl: string, apiKey?: string): Promise<boolean> {
  if (!baseUrl || baseUrl.length < 5) return false;
  const normalizedBase = normalizeUrl(baseUrl);
  
  const endpoints = [
    joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/models' : '/v1/models'),
    normalizedBase
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(apiKey),
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) return true;
    } catch (e) {}
  }
  return false;
}

export async function fetchModels(baseUrl: string, apiKey?: string): Promise<LLMModel[]> {
  if (!baseUrl) return [];
  const normalizedBase = normalizeUrl(baseUrl);
  const url = joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/models' : '/v1/models');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(apiKey),
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

export async function loadModel(baseUrl: string, modelId: string, apiKey?: string): Promise<boolean> {
  if (!baseUrl || !modelId) return false;
  const base = normalizeUrl(baseUrl).replace(/\/v1$/, '');
  const loadUrl = joinPath(base, '/api/v1/models/load');
  
  try {
    const response = await fetch(loadUrl, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ model_key: modelId }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.status === 404) return true;
    
    return response.ok;
  } catch (e) {
    return true; 
  }
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any, apiKey?: string) {
  if (!baseUrl) throw new Error("No engine URL provided.");
  const normalizedBase = normalizeUrl(baseUrl);
  const chatUrl = joinPath(normalizedBase, normalizedBase.includes('/v1') ? '/chat/completions' : '/v1/chat/completions');
  
  try {
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: getHeaders(apiKey),
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
      if (response.status === 504) {
        throw new Error("Node Gateway Timeout (504). The engine is unreachable or taking too long.");
      }
      const errorData = await safeJsonParse(response);
      throw new Error(errorData?.error?.message || `Engine error (${response.status})`);
    }

    const data = await safeJsonParse(response);
    if (!data) throw new Error('Received an incompatible non-JSON response from the server.');
    
    return data.choices?.[0]?.message?.content || "No response produced.";
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error("Node connection timed out.");
    throw err;
  }
}