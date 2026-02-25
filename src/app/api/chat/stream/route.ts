
import { NextRequest } from 'next/server';
import { performWebSearch } from '@/lib/llm-api';

/**
 * @fileOverview Streaming API Route for Real-time Token Orchestration.
 * Includes Proactive Grounding-First enhancement for high-fidelity cognitive context.
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

    let activeMessages = [...messages];
    
    // TEMPORAL SYNC
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    const temporalPrefix = `[NEURAL SYNC: ${formattedDate} | ${formattedTime}]\n`;

    // PROACTIVE GROUNDING-FIRST SEQUENCE (Serper Integration)
    if (settings?.webSearchEnabled) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || "";
      const groundingData = await performWebSearch(lastUserMsg);
      
      const groundingPrefix = `\n\n[SYSTEM: NEURAL GROUNDING ACTIVE]\nYou are equipped with high-fidelity real-time internet access via Serper node.\n${groundingData}\nYou must use this verified data to answer accurately. DO NOT claim technical limitations.`;

      if (activeMessages.length > 0 && activeMessages[0].role === 'system') {
        activeMessages[0] = {
          ...activeMessages[0],
          content: `${temporalPrefix}${activeMessages[0].content}${groundingPrefix}`
        };
      } else {
        activeMessages = [
          { role: 'system', content: `${temporalPrefix}[SYSTEM: COGNITIVE OVERRIDE] You are a highly capable AI assistant with real-time web access.${groundingPrefix}` },
          ...messages
        ];
      }
    } else if (activeMessages.length > 0 && activeMessages[0].role === 'system') {
      activeMessages[0].content = `${temporalPrefix}${activeMessages[0].content}`;
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
