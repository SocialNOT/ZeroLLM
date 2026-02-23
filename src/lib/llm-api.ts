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
  // Ensure no trailing slashes that cause double slashes in concatenation
  return normalized.replace(/\/+$/, '');
}

/**
 * Safely parses JSON from a response, checking the content type first.
 * Does not log to console to avoid Next.js error overlays.
 */
async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Not JSON');
  }
  
  try {
    return await response.json();
  } catch (e) {
    throw new Error('Invalid JSON');
  }
}

export async function testConnection(baseUrl: string): Promise<boolean> {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Try multiple common endpoints to see if any return a valid response (JSON or even 401/405)
  const endpoints = [
    `${normalizedBase}/v1/models`, 
    `${normalizedBase}/api/tags`, // Ollama specific
    `${normalizedBase}/api/v1/models`,
    `${normalizedBase}/models`,
    normalizedBase
  ];
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        signal: AbortSignal.timeout(3000)
      });
      
      // If we get JSON back, it's definitely an API
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return true;
      }

      // If we get 401/405/200 but it's not JSON, it might just be the root UI.
      // We'll return true only if it's a "standard" API status or if it explicitly allows CORS
      if (response.ok || response.status === 401 || response.status === 405) {
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  return false;
}

export async function fetchModels(baseUrl: string): Promise<LLMModel[]> {
  const normalizedBase = normalizeUrl(baseUrl);
  const endpoints = [
    `${normalizedBase}/v1/models`, 
    `${normalizedBase}/api/tags`, // Ollama specific
    `${normalizedBase}/api/v1/models`,
    `${normalizedBase}/models`
  ];
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        signal: AbortSignal.timeout(4000)
      });
      
      if (!response.ok) continue;
      
      const data = await safeJsonParse(response).catch(() => null);
      if (!data) continue;
      
      // Handle different formats
      // 1. OpenAI format: { data: [...] }
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m: any) => ({ id: m.id, name: m.id }));
      }
      // 2. Ollama format: { models: [...] }
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((m: any) => ({ id: m.name, name: m.name }));
      }
      // 3. Raw array
      if (Array.isArray(data)) {
        return data.map((m: any) => ({ 
          id: typeof m === 'string' ? m : (m.id || m.name), 
          name: typeof m === 'string' ? m : (m.name || m.id) 
        }));
      }
    } catch (error) {
      // Silently fail and try next endpoint
    }
  }
  return [];
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any) {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Try to find the correct chat endpoint
  let chatUrl = `${normalizedBase}/chat/completions`;
  if (normalizedBase.includes('/v1')) {
    chatUrl = `${normalizedBase}/chat/completions`;
  } else if (normalizedBase.includes(':11434')) {
    // Ollama specific
    chatUrl = `${normalizedBase}/api/chat`;
  } else if (!normalizedBase.includes('/api/')) {
    chatUrl = `${normalizedBase}/v1/chat/completions`;
  }

  try {
    // For Ollama, the payload is slightly different if using /api/chat
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
      model: modelId,
      messages,
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
      const errorText = await response.text().catch(() => 'Unknown server error');
      throw new Error(`Engine Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    const data = await safeJsonParse(response);
    
    // Extract content based on format
    if (isOllamaApi) {
      return data.message?.content || "No response.";
    }
    return data.choices?.[0]?.message?.content || "No response.";
  } catch (error: any) {
    throw error;
  }
}
