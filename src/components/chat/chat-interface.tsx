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
  WifiOff,
  Calculator,
  Terminal,
  Database,
  Shield,
  ArrowRight,
  Cpu,
  Command,
  Sparkles,
  Layers,
  UserCircle,
  Clock,
  LogIn,
  Palette,
  Cloud,
  Laptop
} from "lucide-react";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
import { personaDrivenChat } from "@/ai/flows/persona-driven-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
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
    activeTheme,
    aiMode,
    setAiMode
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("01:00:00");
  const [latency, setLatency] = useState("---");
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
    if (mounted && connectionStatus === 'online') {
      const updateLatency = () => {
        const val = aiMode === 'online' ? Math.floor(Math.random() * 100 + 50) : Math.floor(Math.random() * 40 + 10);
        setLatency(`${val}ms`);
      };
      updateLatency();
      const latInterval = setInterval(updateLatency, 10000);
      return () => clearInterval(latInterval);
    } else {
      setLatency("---");
    }
  }, [connectionStatus, mounted, aiMode]);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitRecognition' in window)) {
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
      if (friendlyError.includes('Failed to fetch')) {
        friendlyError = "ERROR: Network protocol failure. Local engine might be unreachable or offline mode needs endpoint verification.";
      }
      updateMessage(session.id, assistantMsgId, {
        content: `ERROR: ${friendlyError}`
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

  const themeLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentThemeLabel = activeTheme === 'auto' ? `Auto Sync` : `${themeLabels[Number(activeTheme)]} Logic`;

  if (!session) return null;

  return (
    <Sheet>
      <div className="flex h-full w-full flex-col overflow-hidden bg-background relative">
        
        {isGuest && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1 border-b border-border bg-primary/5 z-30">
            <div className="flex items-center justify-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-primary shadow-none">
              <span className="text-[6px] font-black uppercase tracking-widest text-primary leading-none">TTL:</span>
              <Clock size={8} className="text-primary" />
              <span className="text-[9px] font-black font-mono tracking-tight text-foreground leading-none">
                {timeLeft}
              </span>
            </div>
            <Link href="/auth/login">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-primary/10 transition-all cursor-pointer">
                <span className="text-[6px] font-black uppercase tracking-widest text-primary leading-none">Sign In</span>
                <LogIn size={8} className="text-primary" />
              </div>
            </Link>
          </div>
        )}

        <div className="flex-shrink-0 flex flex-col border-b border-border px-2 py-1.5 sm:px-6 sm:py-3 bg-background z-20">
          <div className="flex items-center justify-between gap-2">
            <SettingsDialog>
              <button className="flex items-center gap-1.5 group transition-all text-left bg-white px-1 py-0.5 rounded-lg border border-border shadow-sm active:scale-95 min-w-0 max-w-[120px] sm:max-w-none sm:min-w-[160px]">
                <div className={cn(
                  "h-6 w-6 sm:h-8 sm:w-8 rounded-md flex items-center justify-center transition-all shrink-0",
                  connectionStatus === 'online' ? "bg-primary text-white" : "bg-destructive text-white"
                )}>
                  {aiMode === 'online' ? <Cloud size={12} className="animate-pulse" /> : <Wifi size={12} />}
                </div>
                <div className="flex flex-col items-start overflow-hidden flex-1 leading-none">
                  <span className={cn(
                    "text-[7px] sm:text-[9px] font-black uppercase tracking-tight truncate w-full",
                    connectionStatus === 'online' ? "text-primary" : "text-destructive"
                  )}>
                    {aiMode === 'online' ? "Cloud Node" : "Local Node"}
                  </span>
                  <span className="text-[6px] sm:text-[7px] font-bold text-foreground uppercase tracking-wider truncate w-full">
                    {aiMode === 'online' ? "Gemini 2.5" : (connection?.modelId || "Engine")}
                  </span>
                </div>
              </button>
            </SettingsDialog>

            {mounted && (
              <div className="hidden sm:flex items-center justify-center gap-3 flex-1 overflow-hidden px-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-primary">{currentTime?.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                <div className="bg-white px-2 py-1 rounded border border-border shadow-sm">
                  <span className="text-[12px] font-black font-mono tracking-tighter text-foreground">
                    {currentTime?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-accent">{currentTime?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="outline" size="icon" onClick={() => setAiMode(aiMode === 'online' ? 'offline' : 'online')} className={cn("h-7 w-7 rounded-md border border-border transition-all", aiMode === 'online' ? "bg-primary text-white" : "bg-white text-foreground")}>
                {aiMode === 'online' ? <Cloud size={14} /> : <Laptop size={14} />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => cycleTheme()} className="h-7 w-7 rounded-md border border-border text-foreground hover:bg-primary hover:text-white transition-all">
                <Palette size={14} />
              </Button>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-md border border-border text-foreground hover:bg-primary hover:text-white transition-colors">
                  <Settings2 size={14} />
                </Button>
              </SheetTrigger>
              <SidebarTrigger className="h-7 w-7 border border-border text-foreground hover:bg-primary hover:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 mt-1.5 border border-border rounded-md overflow-hidden bg-primary/5 divide-x divide-border shadow-inner">
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('personas')} className="flex flex-col items-center justify-center py-1 px-0.5 hover:bg-accent hover:text-white transition-all group text-center active:scale-95">
                <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-widest text-foreground group-hover:text-white">Identity</span>
                <span className="text-[7px] sm:text-[8px] font-black uppercase truncate w-full mt-0.5 px-1">{persona.name}</span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('frameworks')} className="flex flex-col items-center justify-center py-1 px-0.5 hover:bg-primary hover:text-white transition-all group text-center active:scale-95">
                <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-widest text-foreground group-hover:text-white">Arch</span>
                <span className="text-[7px] sm:text-[8px] font-black uppercase truncate w-full mt-0.5 px-1">{framework?.name || "None"}</span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('linguistic')} className="flex flex-col items-center justify-center py-1 px-0.5 hover:bg-destructive hover:text-white transition-all group text-center active:scale-95">
                <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-widest text-foreground group-hover:text-white">Logic</span>
                <span className="text-[7px] sm:text-[8px] font-black uppercase truncate w-full mt-0.5 px-1">{linguistic?.name || "Default"}</span>
              </button>
            </SheetTrigger>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
          <div className="mx-auto flex w-full max-w-4xl flex-col py-4 px-3 sm:px-6">
            {session.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                <div className="space-y-2">
                  <Zap className="text-primary mx-auto animate-pulse" size={40} />
                  <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tighter">Neural Node Synchronized</h2>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Establish Cognitive Sequence</p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                  {cognitiveStarters.map((starter, idx) => (
                    <button key={idx} onClick={() => setInput(starter.prompt)} className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-border shadow-sm hover:shadow-md hover:border-primary transition-all text-left">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">{starter.icon}</div>
                      <span className="text-[11px] sm:text-[13px] font-black text-foreground tracking-tight truncate">{starter.title}</span>
                      <ArrowRight size={14} className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              session.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined} />
              ))
            )}
            {isTyping && !session.messages[session.messages.length - 1]?.content && (
              <div className="flex items-center gap-2 px-4 py-4 text-[9px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">
                <Brain size={12} className="animate-bounce" />
                Orchestrating Logic...
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-2 sm:p-4 bg-background border-t border-border z-30">
          <div className="mx-auto max-w-3xl space-y-2">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mx-auto overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'webSearch', icon: <Search size={12} />, title: 'Grounding' },
                { id: 'reasoning', icon: <Brain size={12} />, title: 'Thinking' },
                { id: 'voice', icon: session.settings.voiceResponseEnabled ? <Mic size={12} /> : <MicOff size={12} />, title: 'Voice' },
                { id: 'calculator', icon: <Calculator size={12} />, title: 'Math' },
                { id: 'code', icon: <Terminal size={12} />, title: 'Code' },
                { id: 'knowledge', icon: <Database size={12} />, title: 'Vault' }
              ].map(tool => (
                <button 
                  key={tool.id} 
                  onClick={() => toggleTool(session.id, tool.id as any)} 
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all text-[8px] font-black uppercase tracking-widest shrink-0",
                    (session.settings as any)[tool.id + (tool.id === 'webSearch' ? 'Enabled' : tool.id === 'reasoning' ? 'Enabled' : tool.id === 'voice' ? 'ResponseEnabled' : 'Enabled')] 
                      ? "bg-primary text-white border-primary shadow-sm" 
                      : "bg-white text-foreground border-border hover:border-primary"
                  )}
                >
                  {tool.icon}
                  <span className="hidden sm:inline">{tool.title}</span>
                </button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center bg-white hover:bg-primary/5 transition-all rounded-xl p-1 border-2 border-border shadow-lg focus-within:border-primary">
              <Button type="button" variant="ghost" size="icon" onClick={handleMicToggle} className={cn("h-9 w-9 transition-all rounded-lg shrink-0", isListening ? "text-white bg-destructive animate-pulse" : "text-foreground hover:bg-primary hover:text-white")}>
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={isListening ? "Sampling Audio..." : "Input command..."}
                className="h-9 w-full border-none bg-transparent px-3 text-[13px] font-bold focus-visible:ring-0 placeholder:text-foreground/40"
              />
              <Button type="submit" disabled={!input.trim() || isTyping} className="h-9 w-9 rounded-lg bg-primary text-white shadow-md hover:scale-105 active:scale-95 transition-all shrink-0">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>

        <SheetContent side="right" className="w-full sm:min-w-[400px] border-l border-border p-0 bg-background shadow-2xl">
          <SheetHeader className="p-4 border-b border-border bg-primary/5">
            <SheetTitle className="text-lg font-black text-foreground">Cognitive Hub</SheetTitle>
            <p className="text-[8px] text-primary font-black uppercase tracking-[0.2em]">Neural Node Parameters</p>
          </SheetHeader>
          <ParameterControls />
        </SheetContent>
      </div>
    </Sheet>
  );
}