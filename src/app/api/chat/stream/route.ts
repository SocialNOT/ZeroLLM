import { NextRequest } from 'next/server';
import { performWebSearch } from '@/lib/llm-api';
import { ai } from '@/ai/genkit';

/**
 * @fileOverview Streaming API Route for Real-time Token Orchestration.
 * Includes Proactive Grounding-First enhancement and Genkit (Online) streaming support.
 */

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, modelId, messages, settings, apiKey } = await req.json();

    if (!baseUrl) {
      return new Response(JSON.stringify({ error: "No engine URL provided." }), { status: 400 });
    }

    let activeMessages = [...messages];
    
    // TEMPORAL SYNC (IST Precise Node)
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const temporalPrefix = `[NEURAL SYNC: ${formattedDate} | ${formattedTime}]\n`;

    // PROACTIVE GROUNDING-FIRST SEQUENCE (Serper Integration)
    let groundingPrefix = "";
    if (settings?.webSearchEnabled) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || "";
      const groundingData = await performWebSearch(lastUserMsg);
      if (groundingData) {
        groundingPrefix = `\n\n[SYSTEM: NEURAL GROUNDING ACTIVE]\nYou are equipped with real-time internet access.\n${groundingData}\nYou must use this data to answer accurately.`;
      }
    }

    // Reasoning Enhancement
    let reasoningSuffix = settings?.reasoningEnabled ? "\n\n[SYSTEM: REASONING PROTOCOL ACTIVE]\nYou MUST show your thinking process step-by-step before providing the final answer." : "";

    // Inject Context into the System Message
    if (activeMessages.length > 0 && activeMessages[0].role === 'system') {
      activeMessages[0] = {
        ...activeMessages[0],
        content: `${temporalPrefix}${activeMessages[0].content}${groundingPrefix}${reasoningSuffix}`
      };
    } else {
      activeMessages = [
        { role: 'system', content: `${temporalPrefix}[SYSTEM: COGNITIVE OVERRIDE] You are a highly capable AI assistant.${groundingPrefix}${reasoningSuffix}` },
        ...messages
      ];
    }

    // CASE 1: ONLINE MODE (GENKIT / GEMINI)
    if (baseUrl === 'genkit') {
      const targetModel = (modelId.startsWith('googleai/') ? modelId : `googleai/${modelId}`) as any;
      
      const lastMsg = activeMessages[activeMessages.length - 1];
      const systemMsg = activeMessages.find(m => m.role === 'system')?.content || "";
      const conversationHistory = activeMessages.filter(m => m.role !== 'system' && m !== lastMsg).map(m => ({
        role: m.role as any,
        content: [{ text: m.content }]
      }));

      const { stream } = ai.generateStream({
        model: targetModel,
        system: systemMsg,
        prompt: lastMsg.content,
        history: conversationHistory,
        config: {
          temperature: settings.temperature || 0.7,
          topP: settings.topP || 0.9,
          maxOutputTokens: settings.maxTokens || 1024,
        }
      });

      return new Response(new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of stream) {
              const text = chunk.text;
              if (text) {
                const payload = JSON.stringify({ choices: [{ delta: { content: text } }] });
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        }
      }), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // CASE 2: OFFLINE MODE (CUSTOM ENGINE PROXY)
    let chatUrl = baseUrl.trim();
    if (!/^https?:\/\//i.test(chatUrl)) chatUrl = `http://${chatUrl}`;
    chatUrl = chatUrl.replace(/\/+$/, '');
    
    const finalUrl = chatUrl.includes('/v1') 
      ? `${chatUrl}/chat/completions` 
      : `${chatUrl}/v1/chat/completions`;

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
