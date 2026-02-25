
import { NextRequest } from 'next/server';
import { performWebSearch } from '@/lib/llm-api';

/**
 * @fileOverview Streaming API Route for Real-time Token Orchestration.
 * Includes Grounding-First enhancement for high-fidelity web search.
 */

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, modelId, messages, settings, apiKey } = await req.json();

    if (!baseUrl) {
      return new Response(JSON.stringify({ error: "No engine URL provided." }), { status: 400 });
    }

    let chatUrl = baseUrl.trim();
    if (!/^https?:\/\//i.test(chatUrl)) chatUrl = `http://${chatUrl}`;
    chatUrl = chatUrl.replace(/\/+$/, '');
    
    const finalUrl = chatUrl.includes('/v1') 
      ? `${chatUrl}/chat/completions` 
      : `${chatUrl}/v1/chat/completions`;

    // High-Fidelity Web Grounding Sequence (Grounding-First)
    let activeMessages = [...messages];
    if (settings?.webSearchEnabled) {
      const lastUserMsg = messages[messages.length - 1]?.content;
      if (lastUserMsg) {
        // Automatically perform search before sending to local model
        const searchResults = await performWebSearch(lastUserMsg);
        
        // Inject grounding context into the system prompt (first message)
        const groundingPrefix = `\n\n[SYSTEM: WEB GROUNDING ACTIVE]\nThe following verified search results have been retrieved from the internet. Use them to answer the user accurately with real-time data. If info is missing, inform the user you searched but found limited data. DO NOT CLAIM YOU CANNOT ACCESS THE WEB.\n\n${searchResults}`;

        if (activeMessages.length > 0 && activeMessages[0].role === 'system') {
          activeMessages[0] = {
            ...activeMessages[0],
            content: `${activeMessages[0].content}${groundingPrefix}`
          };
        } else {
          activeMessages = [
            { role: 'system', content: `[SYSTEM: COGNITIVE OVERRIDE] You are a highly capable AI assistant with real-time web access. You must use the provided data to answer correctly.${groundingPrefix}` },
            ...messages
          ];
        }
      }
    }

    // Reasoning Enhancement for Custom Engines
    if (settings?.reasoningEnabled && activeMessages.length > 0 && activeMessages[0].role === 'system') {
      activeMessages[0].content += `\n\n[SYSTEM: REASONING PROTOCOL ACTIVE]\nYou MUST show your thinking process step-by-step before providing the final answer.`;
    }

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: modelId || "default",
        messages: activeMessages.map((m: any) => ({ role: m.role, content: m.content })),
        temperature: settings.temperature || 0.7,
        top_p: settings.topP || 0.9,
        max_tokens: settings.maxTokens || 1024,
        stream: true
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error: `Engine Node Error: ${error}` }), { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Stream Proxy Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
