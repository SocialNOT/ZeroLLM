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
    // Fail silently to the caller rather than crashing
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
  
  // Based on logs, /v1/models is the most reliable endpoint for LM Studio
  const endpoints = [
    `${normalizedBase}/v1/models`, 
    `${normalizedBase}/api/tags`, 
    normalizedBase
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
      
      if (response.status === 401 || response.status === 405) {
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
    `${normalizedBase}/api/tags`
  ];
  
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) continue;
      
      const data = await safeJsonParse(response);
      if (!data) continue;
      
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m: any) => ({ id: m.id, name: m.id }));
      }
      if (data.models && Array.isArray(data.models)) {
        return data.models.map((m: any) => ({ id: m.name, name: m.name }));
      }
    } catch (error) {
      // Try next
    }
  }
  return [];
}

export async function callChatCompletion(baseUrl: string, modelId: string, messages: any[], settings: any) {
  const normalizedBase = normalizeUrl(baseUrl);
  
  // Prioritize OpenAI-compatible /v1/chat/completions as it worked in logs
  let chatUrl = `${normalizedBase}/v1/chat/completions`;
  if (normalizedBase.endsWith('/v1')) {
    chatUrl = `${normalizedBase}/chat/completions`;
  } else if (normalizedBase.includes(':11434')) {
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
    const errorText = await response.text().catch(() => 'Engine error');
    throw new Error(`Engine Error: ${errorText.substring(0, 50)}`);
  }

  const data = await safeJsonParse(response);
  if (!data) throw new Error('Invalid response from engine');
  
  if (isOllamaApi) {
    return data.message?.content || "No response.";
  }
  return data.choices?.[0]?.message?.content || "No response.";
}
