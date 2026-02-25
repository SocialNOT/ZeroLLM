"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { ChatMessage } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Settings2, 
  Zap, 
  Brain, 
  Mic, 
  MicOff, 
  Search,
  Wifi,
  Calculator,
  Terminal,
  Database,
  Shield,
  ArrowRight,
  Cpu,
  Sparkles,
  Layers,
  Clock,
  LogIn,
  Palette,
  Cloud,
  Laptop,
  Globe
} from "lucide-react";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
import { personaDrivenChat } from "@/ai/flows/persona-driven-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { ParameterControls } from "./parameter-controls";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { generateChatTitle } from "@/ai/actions/chat-actions";
import { toast } from "@/hooks/use-toast";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import Link from "next/link";

export function ChatInterface() {
  const { 
    activeSessionId, 
    sessions, 
    addMessage, 
    updateSession,
    updateMessage,
    personas, 
    frameworks,
    linguisticControls,
    connections,
    activeConnectionId,
    currentUserRole,
    connectionStatus,
    setActiveParameterTab,
    toggleTool,
    sessionStartTime,
    cycleTheme,
    aiMode,
    setAiMode
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("01:00:00");
  const [mounted, setMounted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastProcessedIndexRef = useRef<number>(0);
  
  const session = sessions.find(s => s.id === activeSessionId);
  const persona = personas.find(p => p.id === session?.personaId) || personas[0];
  const framework = frameworks.find(f => f.id === session?.frameworkId);
  const linguistic = linguisticControls.find(l => l.id === session?.linguisticId);
  const connection = connections.find(c => c.id === activeConnectionId) || connections[0];

  const isGuest = currentUserRole === 'Viewer';

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (isGuest && sessionStartTime) {
        const ONE_HOUR = 3600000;
        const expiryTime = sessionStartTime + ONE_HOUR;
        const remaining = Math.max(0, expiryTime - now.getTime());

        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime, isGuest]);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = Math.max(event.resultIndex, lastProcessedIndexRef.current); i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
            lastProcessedIndexRef.current = i + 1;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech Recognition Error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [mounted]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [session?.messages?.length, isTyping, session?.messages[session?.messages.length - 1]?.content]);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Microphone Node Unavailable",
        description: "Your browser does not support high-fidelity voice-to-text."
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      lastProcessedIndexRef.current = 0;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || !session || isTyping) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (session.messages.length === 0) {
      generateChatTitle(textToSend).then(title => updateSession(session.id, { title }));
    }

    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content: textToSend,
      timestamp: Date.now()
    };

    addMessage(session.id, userMsg);
    setInput("");
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg = {
      id: assistantMsgId,
      role: "assistant" as const,
      content: "",
      timestamp: Date.now()
    };
    addMessage(session.id, assistantMsg);

    try {
      const combinedSystemPrompt = [
        `You are acting as: ${persona.name}. ${persona.system_prompt}`,
        framework ? `\n\n[STRUCTURAL FRAMEWORK: ${framework.name}]\n${framework.content}` : '',
        linguistic ? `\n\n[LINGUISTIC CONSTRAINTS: ${linguistic.name}]\n${linguistic.system_instruction}` : ''
      ].filter(Boolean).join('\n\n').trim();

      if (aiMode === 'online') {
        const responseText = await personaDrivenChat({
          baseUrl: 'genkit',
          modelId: 'gemini-2.5-flash',
          systemPrompt: combinedSystemPrompt,
          userMessage: textToSend,
          temperature: session.settings.temperature,
          topP: session.settings.topP,
          maxTokens: session.settings.maxTokens,
          history: session.messages.map(m => ({ 
            role: m.role as any, 
            content: m.content,
            timestamp: m.timestamp
          })),
          webSearchEnabled: session.settings.webSearchEnabled,
          reasoningEnabled: session.settings.reasoningEnabled
        });

        updateMessage(session.id, assistantMsgId, { content: responseText });

        if (session.settings.voiceResponseEnabled && responseText) {
          try {
            const { audioUri } = await generateSpeech({ text: responseText });
            const audio = new Audio(audioUri);
            audio.play();
          } catch (vErr) {
            console.warn("Voice auto-play failed", vErr);
          }
        }
      } else {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: connection?.baseUrl || '',
            modelId: connection?.modelId || '',
            messages: [
              { role: 'system', content: combinedSystemPrompt },
              ...session.messages,
              { role: 'user', content: textToSend }
            ],
            settings: session.settings,
            apiKey: connection?.apiKey
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Stream Initialization Failed");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    accumulatedContent += delta;
                    updateMessage(session.id, assistantMsgId, { content: accumulatedContent });
                  }
                } catch (e) {}
              }
            }
          }
        }

        if (session.settings.voiceResponseEnabled && accumulatedContent) {
          try {
            const { audioUri } = await generateSpeech({ text: accumulatedContent });
            const audio = new Audio(audioUri);
            audio.play();
          } catch (vErr) {
            console.warn("Voice auto-play failed", vErr);
          }
        }
      }

    } catch (error: any) {
      let friendlyError = error.message || 'Node connection failure.';
      if (friendlyError.includes('Too Many Requests') || friendlyError.includes('429')) {
        friendlyError = "FAILURE: RESOURCE_EXHAUSTED. Gemini node rate limit reached. Please wait for signal reset.";
      }
      updateMessage(session.id, assistantMsgId, {
        content: `FAILURE: ${friendlyError}`
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleRegenerate = async () => {
    if (!session || session.messages.length === 0 || isTyping) return;
    const lastUserMsg = [...session.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      await handleSend(lastUserMsg.content);
    }
  };

  const cognitiveStarters = [
    { 
      title: "First Principles Analysis", 
      prompt: "Analyze the following using First Principles thinking: ",
      icon: <Brain size={14} className="text-primary" />
    },
    { 
      title: "Technical STRIDE Audit", 
      prompt: "Perform a STRIDE threat model on this system architecture: ",
      icon: <Shield size={14} className="text-destructive" />
    }
  ];

  if (!session) return null;

  return (
    <Sheet>
      <div className="flex h-svh w-full flex-col overflow-hidden bg-background relative border-border">
        
        {isGuest && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1 border-b-2 border-border bg-primary/5 z-30">
            <div className="flex items-center justify-center gap-1.5 bg-white px-2 py-0.5 rounded-full border-2 border-primary shadow-none">
              <span className="text-[7px] font-black uppercase tracking-widest text-primary leading-none">TTL:</span>
              <Clock size={10} className="text-primary" />
              <span className="text-[10px] font-black font-mono tracking-tight text-foreground leading-none">
                {timeLeft}
              </span>
            </div>
            <Link href="/auth/login">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer">
                <span className="text-[7px] font-black uppercase tracking-widest leading-none">Sign In</span>
                <LogIn size={10} />
              </div>
            </Link>
          </div>
        )}

        <div className="flex-shrink-0 flex flex-col border-b-2 border-border px-3 py-2 sm:px-6 bg-white z-20 overflow-hidden">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
            <SettingsDialog>
              <button className="flex items-center gap-2 group transition-all text-left bg-slate-50 px-2 py-1 rounded-xl border-2 border-border shadow-sm active:scale-95 min-w-0 max-w-[140px] sm:max-w-none flex-shrink-0">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all shrink-0 border-2",
                  connectionStatus === 'online' ? "bg-primary border-primary text-white" : "bg-destructive border-destructive text-white"
                )}>
                  {aiMode === 'online' ? <Cloud size={16} className="animate-pulse" /> : <Wifi size={16} />}
                </div>
                <div className="flex flex-col items-start overflow-hidden flex-1 leading-tight">
                  <span className={cn(
                    "text-[8px] sm:text-[10px] font-black uppercase tracking-tighter truncate w-full",
                    connectionStatus === 'online' ? "text-primary" : "text-destructive"
                  )}>
                    {aiMode === 'online' ? "Cloud Node" : "Local Node"}
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-900 uppercase tracking-widest truncate w-full">
                    {aiMode === 'online' ? "Gemini 2.5" : (connection?.modelId || "Engine")}
                  </span>
                </div>
              </button>
            </SettingsDialog>

            {mounted && currentTime && (
              <div className="flex items-center justify-center gap-1 sm:gap-4 flex-1 overflow-hidden px-1">
                <span className="hidden xs:inline-block text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary shrink-0">
                  {currentTime.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <div className="bg-primary text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border-2 border-primary shadow-lg shadow-primary/20 shrink-0">
                  <span className="text-[10px] sm:text-[14px] font-black font-mono tracking-tighter">
                    {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
                <span className="hidden xs:inline-block text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-accent shrink-0">
                  {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="outline" size="icon" onClick={() => setAiMode(aiMode === 'online' ? 'offline' : 'online')} className={cn("h-8 w-8 rounded-lg border-2 border-border transition-all active:scale-90", aiMode === 'online' ? "bg-primary text-white border-primary" : "bg-white text-slate-900")}>
                {aiMode === 'online' ? <Cloud size={14} /> : <Laptop size={14} />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => cycleTheme()} className="h-8 w-8 rounded-lg border-2 border-border text-slate-900 hover:bg-primary hover:text-white transition-all active:scale-90">
                <Palette size={14} />
              </Button>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-2 border-border text-slate-900 hover:bg-primary hover:text-white transition-colors active:scale-90">
                  <Settings2 size={14} />
                </Button>
              </SheetTrigger>
              <SidebarTrigger className="h-8 w-8 border-2 border-border text-slate-900 hover:bg-primary hover:text-white rounded-lg active:scale-90" />
            </div>
          </div>

          <div className="grid grid-cols-3 border-2 border-border rounded-xl overflow-hidden bg-slate-50 divide-x-2 divide-border shadow-inner shrink-0">
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('personas')} className="flex flex-col items-center justify-center py-1 px-0.5 hover:bg-accent hover:text-white transition-all group text-center active:scale-95 overflow-hidden">
                <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-slate-900 group-hover:text-white shrink-0">Identity</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase truncate w-full mt-0.5 px-1">{persona.name}</span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('frameworks')} className="flex flex-col items-center justify-center py-1 px-0.5 hover:bg-primary hover:text-white transition-all group text-center active:scale-95 overflow-hidden">
                <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-slate-900 group-hover:text-white shrink-0">Arch</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase truncate w-full mt-0.5 px-1">{framework?.name || "None"}</span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('linguistic')} className="flex flex-col items-center justify-center py-1 px-0.5 hover:bg-destructive hover:text-white transition-all group text-center active:scale-95 overflow-hidden">
                <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-slate-900 group-hover:text-white shrink-0">Logic</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase truncate w-full mt-0.5 px-1">{linguistic?.name || "Default"}</span>
              </button>
            </SheetTrigger>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
          <div className="mx-auto flex w-full max-w-5xl flex-col py-6 px-4 sm:px-8">
            {session.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <Zap className="text-primary mx-auto animate-pulse" size={48} />
                    <Sparkles className="absolute -top-2 -right-2 text-accent" size={20} />
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter">Neural Node Synchronized</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Establish Cognitive Sequence</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                  {cognitiveStarters.map((starter, idx) => (
                    <button key={idx} onClick={() => setInput(starter.prompt)} className="group flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-border shadow-sm hover:shadow-xl hover:border-primary transition-all text-left">
                      <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">{starter.icon}</div>
                      <span className="text-[12px] sm:text-[14px] font-black text-slate-900 tracking-tight leading-tight">{starter.title}</span>
                      <ArrowRight size={16} className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-3 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {session.messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined} />
                ))}
              </div>
            )}
            {isTyping && !session.messages[session.messages.length - 1]?.content && (
              <div className="flex items-center gap-3 px-6 py-6 text-[11px] text-primary font-black uppercase tracking-[0.3em] animate-pulse">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                </div>
                Orchestrating Logic...
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-3 sm:p-6 bg-white border-t-2 border-border z-30">
          <div className="mx-auto max-w-4xl space-y-3">
            <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mx-auto overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'webSearch', icon: <Search size={14} />, title: 'Grounding' },
                { id: 'reasoning', icon: <Brain size={14} />, title: 'Thinking' },
                { id: 'voice', icon: <Mic size={14} />, title: 'Voice' },
                { id: 'calculator', icon: <Calculator size={14} />, title: 'Math' },
                { id: 'code', icon: <Terminal size={14} />, title: 'Code' },
                { id: 'knowledge', icon: <Database size={14} />, title: 'Vault' }
              ].map(tool => {
                const settingKey = tool.id === 'webSearch' ? 'webSearchEnabled' : 
                                 tool.id === 'reasoning' ? 'reasoningEnabled' : 
                                 tool.id === 'voice' ? 'voiceResponseEnabled' : 
                                 tool.id + 'Enabled';
                return (
                  <button 
                    key={tool.id} 
                    onClick={() => toggleTool(session.id, tool.id as any)} 
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-[9px] font-black uppercase tracking-[0.1em] shrink-0 active:scale-95",
                      (session.settings as any)[settingKey] 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : "bg-white text-slate-950 border-border hover:border-primary"
                    )}
                  >
                    {tool.icon}
                    <span className="hidden md:inline">{tool.title}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center bg-white hover:bg-slate-50 transition-all rounded-2xl p-1.5 border-2 border-border shadow-2xl focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5">
              <Button type="button" variant="ghost" size="icon" onClick={handleMicToggle} className={cn("h-11 w-11 transition-all rounded-xl shrink-0 active:scale-90", isListening ? "text-white bg-destructive animate-pulse" : "text-slate-950 hover:bg-primary/10")}>
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={isListening ? "SAMPLING AUDIO NODE..." : "Input command sequence..."}
                className="h-11 w-full border-none bg-transparent px-2 sm:px-4 text-[14px] sm:text-[15px] font-black focus-visible:ring-0 placeholder:text-slate-500 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
              />
              <Button type="submit" disabled={!input.trim() || isTyping} className="h-11 w-11 rounded-xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-90 transition-all shrink-0">
                <Send size={20} />
              </Button>
            </form>
          </div>
        </div>
      </div>
      <SheetContent side="right" className="p-0 border-l-2 border-border w-full sm:max-w-md">
        <ParameterControls />
      </SheetContent>
    </Sheet>
  );
}
