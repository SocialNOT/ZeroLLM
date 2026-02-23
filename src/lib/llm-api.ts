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
 * Based on logs, we ensure we don't double-append paths like /v1/v1.
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
  
  // Based on logs, LM Studio works best with /v1/models
  // We avoid pings to / or /api which cause errors in user logs
  const endpoints = [
    `${normalizedBase}/v1/models`,
    normalizedBase.includes('/v1') ? normalizedBase : `${normalizedBase}/v1/models`
  ];
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await safeJsonParse(response);
        if (data) return true;
      }
    } catch (e) {
      continue;
    }
  }
  return false;
}

export async function fetchModels(baseUrl: string): Promise<LLMModel[]> {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Directly target the path confirmed working in logs
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
    
    // Support for OpenAI standard list format
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((m: any) => ({ id: m.id, name: m.id }));
    }
    // Support for Ollama format
    if (data.models && Array.isArray(data.models)) {
      return data.models.map((m: any) => ({ id: m.name, name: m.name }));
    }
  } catch (error) {
    console.error('Fetch models failed', error);
  }
  return [];
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any) {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Precise path construction based on successful logs
  let chatUrl = normalizedBase.endsWith('/v1') ? `${normalizedBase}/chat/completions` : `${normalizedBase}/v1/chat/completions`;
  
  // Fallback for direct Ollama usage if detected
  if (normalizedBase.includes(':11434') && !normalizedBase.includes('/v1')) {
    chatUrl = `${normalizedBase}/api/chat`;
  }

  const isOllamaApi = chatUrl.endsWith('/api/chat');
  const body = isOllamaApi ? {
    model: modelId,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    stream: false,
    options: {
      temperature: settings.temperature,
      top_p: settings.topP,
      num_predict: settings.maxTokens
    }
  } : {
    model: modelId || "default", // Ensure model is never empty string
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
    const errorText = await response.text().catch(() => 'Engine error');
    throw new Error(`Engine Error: ${errorText.substring(0, 100)}`);
  }

  const data = await safeJsonParse(response);
  if (!data) throw new Error('Invalid JSON response from engine');
  
  if (isOllamaApi) {
    return data.message?.content || "No response.";
  }
  return data.choices?.[0]?.message?.content || "No response.";
}
