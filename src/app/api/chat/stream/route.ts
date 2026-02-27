import { NextRequest } from 'next/server';
import { performWebSearch } from '@/lib/llm-api';
import { ai } from '@/ai/genkit';

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, modelId, messages, settings, apiKey } = await req.json();

    if (!baseUrl) {
      return new Response(JSON.stringify({ error: "No engine URL provided." }), { status: 400 });
    }

    let activeMessages = [...messages];
    
    // Inject temporal and grounding context
    const now = new Date();
    const temporalPrefix = `[NEURAL SYNC: ${now.toLocaleTimeString('en-IN')}]\n`;

    let groundingPrefix = "";
    if (settings?.webSearchEnabled) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || "";
      const groundingData = await performWebSearch(lastUserMsg);
      if (groundingData) groundingPrefix = `\n\n[SYSTEM: WEB GROUNDING ACTIVE]\n${groundingData}`;
    }

    if (activeMessages.length > 0 && activeMessages[0].role === 'system') {
      activeMessages[0].content = `${temporalPrefix}${activeMessages[0].content}${groundingPrefix}`;
    }

    // ONLINE MODE (GENKIT)
    if (baseUrl === 'genkit') {
      const targetModel = (modelId.startsWith('googleai/') ? modelId : `googleai/${modelId}`) as any;
      const lastMsg = activeMessages[activeMessages.length - 1];
      const systemMsg = activeMessages.find(m => m.role === 'system')?.content || "";
      const history = activeMessages.filter(m => m.role !== 'system' && m !== lastMsg).map(m => ({
        role: m.role as any,
        content: [{ text: m.content }]
      }));

      const { stream } = ai.generateStream({
        model: targetModel,
        system: systemMsg,
        prompt: lastMsg.content,
        history,
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
      }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    }

    // OFFLINE MODE (LOCAL PROXY)
    let chatUrl = baseUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(chatUrl)) chatUrl = `http://${chatUrl}`;
    
    // Resilient Dual-Stack Fallback for Localhost
    const urls = [chatUrl];
    if (chatUrl.includes('localhost')) {
      urls.push(chatUrl.replace('localhost', '127.0.0.1'));
    }

    const finalEndpointSuffix = chatUrl.includes('/v1') ? '/chat/completions' : '/v1/chat/completions';
    
    let lastError: any = null;
    for (const u of urls) {
      try {
        const response = await fetch(`${u}${finalEndpointSuffix}`, {
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

        if (response.ok) return new Response(response.body, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
        });
      } catch (e) {
        lastError = e;
        continue;
      }
    }

    return new Response(JSON.stringify({ error: `Engine Unreachable: ${lastError?.message}` }), { status: 500 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
