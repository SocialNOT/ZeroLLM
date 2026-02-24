
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
  LogIn
} from "lucide-react";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
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
    sessionStartTime
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
        const val = Math.floor(Math.random() * 40 + 10);
        setLatency(`${val}ms`);
      };
      updateLatency();
      const latInterval = setInterval(updateLatency, 10000);
      return () => clearInterval(latInterval);
    } else {
      setLatency("---");
    }
  }, [connectionStatus, mounted]);

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

    } catch (error: any) {
      updateMessage(session.id, assistantMsgId, {
        content: `ERROR: ${error.message || 'Node connection failure.'}`
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
    },
    { 
      title: "Type-Safe System Design", 
      prompt: "Architect a high-performance type-safe system for: ",
      icon: <Terminal size={14} className="text-accent" />
    },
    { 
      title: "Scan Knowledge Vault", 
      prompt: "Execute a deep scan of the internal vault for: ",
      icon: <Database size={14} className="text-primary" />
    }
  ];

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
        <Zap className="text-primary mb-4 animate-pulse" size={48} />
        <p className="max-w-xs text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
          Initialize a cognitive sequence to begin.
        </p>
      </div>
    );
  }

  return (
    <Sheet>
      <div className="flex h-full w-full flex-col overflow-hidden bg-card/50 backdrop-blur-sm relative">
        
        {isGuest && (
          <div className="flex-shrink-0 flex items-center justify-center gap-3 py-0.5 border-b border-border/30 bg-slate-50/10 z-30">
            <div className="flex items-center justify-center gap-2 bg-white/40 backdrop-blur-md px-3 py-0.5 rounded-full border border-slate-100/50 shadow-none animate-multi-color-pulse">
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 leading-none mr-1">Session TTL:</span>
              <Clock size={10} className="text-slate-400" />
              <span className="text-[10px] font-black font-mono tracking-tight text-slate-900 leading-none">
                {timeLeft}
              </span>
            </div>
            
            <Link href="/auth/login">
              <div className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-primary/5 transition-all active:scale-95 cursor-pointer">
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary leading-none group-hover:underline">
                  Sign In / Sign Up
                </span>
                <LogIn size={10} className="text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        )}

        <div className="flex-shrink-0 flex flex-col border-b border-border px-3 py-2 sm:px-6 sm:py-2.5 bg-card/90 backdrop-blur-xl z-20">
          <div className="flex items-center justify-between gap-4">
            <SettingsDialog>
              <button className="flex items-center gap-2 group transition-all hover:opacity-80 text-left bg-white/50 backdrop-blur-md px-1.5 py-1 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 active:scale-95 min-w-[120px] sm:min-w-[160px]">
                <div className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 rounded-[0.75rem] flex items-center justify-center transition-all shadow-inner border shrink-0",
                  connectionStatus === 'online' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
                )}>
                  {connectionStatus === 'online' ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
                </div>
                <div className="flex flex-col items-start text-left pr-1 overflow-hidden min-w-0 flex-1">
                  <div className="flex items-center gap-1 leading-none w-full justify-between">
                    <span className={cn(
                      "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.05em] whitespace-nowrap",
                      connectionStatus === 'online' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {connectionStatus === 'online' ? "System Optimal" : "Node Offline"}
                    </span>
                    {mounted && connectionStatus === 'online' && (
                      <span className="text-[6px] sm:text-[7px] font-mono font-bold text-slate-400">
                        {latency}
                      </span>
                    )}
                  </div>
                  <span className="text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate w-full">
                    {connection?.modelId || "Primary Engine"}
                  </span>
                </div>
              </button>
            </SettingsDialog>

            {mounted && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 flex-1 overflow-hidden px-2">
                <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-[#FF9933] whitespace-nowrap">
                  {currentTime?.toLocaleDateString('en-IN', { weekday: 'short' }) || "DAY"}
                </span>
                <div className="bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-[0_2px_100px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                  <span className="text-[10px] sm:text-[12px] font-black font-mono tracking-tighter text-slate-900 leading-none">
                    {currentTime?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) || "00:00:00"}
                  </span>
                </div>
                <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-[#138808] whitespace-nowrap">
                  {currentTime?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) || "DATE"}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1 shrink-0">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                  <Settings2 size={14} />
                </Button>
              </SheetTrigger>
              <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-primary transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-3 mt-2 border border-border rounded-lg overflow-hidden bg-muted/5 divide-x divide-border shadow-inner">
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('personas')}
                className="flex flex-col items-center justify-center py-1 px-1 hover:bg-accent/10 transition-all group text-center active:scale-95"
              >
                <span className="text-[6px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-accent">Identity</span>
                <span className="text-[8px] font-bold text-accent uppercase truncate w-full mt-0.5 animate-pulse-glow">
                  {persona.name}
                </span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('frameworks')}
                className="flex flex-col items-center justify-center py-1 px-1 hover:bg-primary/10 transition-all group text-center active:scale-95"
              >
                <span className="text-[6px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary">Arch</span>
                <span className={cn(
                  "text-[8px] font-bold uppercase truncate w-full mt-0.5",
                  session.frameworkId ? "text-primary animate-pulse-glow" : "text-muted-foreground/40"
                )}>
                  {framework?.name || "None"}
                </span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('linguistic')}
                className="flex flex-col items-center justify-center py-1 px-1 hover:bg-destructive/10 transition-all group text-center active:scale-95"
              >
                <span className="text-[6px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-destructive">Logic</span>
                <span className={cn(
                  "text-[8px] font-bold uppercase truncate w-full mt-0.5",
                  session.linguisticId ? "text-destructive animate-pulse-glow" : "text-muted-foreground/40"
                )}>
                  {linguistic?.name || "Default"}
                </span>
              </button>
            </SheetTrigger>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
          <div className="mx-auto flex w-full max-w-5xl flex-col py-4 px-2 sm:px-4">
            {session.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-2 sm:py-4 px-4 sm:px-0 animate-in fade-in zoom-in duration-700">
                <div className="text-center mb-4 space-y-1">
                  <h2 className="text-xl sm:text-2xl font-headline font-bold text-slate-900 tracking-tight">Neural Node Ready</h2>
                  <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400">Select Cognitive Starter</p>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
                  {cognitiveStarters.map((starter, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setInput(starter.prompt)}
                      className="group flex items-center gap-3 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all text-left animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-primary/5 transition-colors shrink-0">
                        {starter.icon}
                      </div>
                      <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 tracking-tight truncate">{starter.title}</span>
                      <ArrowRight size={12} className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 sm:gap-4">
                  <SettingsDialog>
                    <Button variant="outline" className="h-9 rounded-xl gap-2 px-4 text-[8px] font-bold uppercase tracking-widest bg-white border-slate-100 shadow-md hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all">
                      <Cpu size={12} className="text-primary" />
                      Control
                    </Button>
                  </SettingsDialog>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveParameterTab('frameworks')}
                      className="h-9 rounded-xl gap-2 px-4 text-[8px] font-bold uppercase tracking-widest bg-white border-slate-100 shadow-md hover:bg-slate-50 hover:text-accent hover:border-accent/30 transition-all"
                    >
                      <Command size={12} className="text-accent" />
                      Hub
                    </Button>
                  </SheetTrigger>
                </div>
              </div>
            ) : (
              session.messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined} 
                />
              ))
            )}
            {isTyping && !session.messages[session.messages.length - 1]?.content && (
              <div className="flex items-center gap-2 px-4 py-4 text-[8px] text-primary font-bold uppercase tracking-[0.2em] animate-pulse">
                <Brain size={10} className="animate-bounce" />
                Processing...
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-3 sm:p-4 bg-card/90 backdrop-blur-2xl border-t border-border/50 z-30">
          <div className="mx-auto max-w-4xl space-y-3">
            
            <div className="flex items-center justify-center gap-2 mx-auto w-full sm:w-[66%] overflow-x-auto no-scrollbar">
              <button 
                onClick={() => toggleTool(session.id, 'webSearch')}
                title="Web Grounding"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.webSearchEnabled 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Search size={14} />
              </button>
              
              <button 
                onClick={() => toggleTool(session.id, 'reasoning')}
                title="Deep Thinking"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.reasoningEnabled 
                    ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Brain size={14} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'voice')}
                title="Voice Synthesis"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.voiceResponseEnabled 
                    ? "bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {session.settings.voiceResponseEnabled ? <Mic size={14} /> : <MicOff size={14} />}
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'calculator')}
                title="Mathematical Logic"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.calculatorEnabled 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Calculator size={14} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'code')}
                title="Code Interpreter"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.codeEnabled 
                    ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Terminal size={14} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'knowledge')}
                title="Knowledge Vault"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.knowledgeEnabled 
                    ? "bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Database size={14} />
              </button>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="relative flex items-center bg-muted/50 hover:bg-muted transition-all rounded-xl sm:rounded-2xl p-1 border border-border shadow-lg focus-within:ring-2 focus-within:ring-primary/20"
            >
              <div className="flex shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleMicToggle}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 transition-all rounded-lg sm:rounded-xl",
                    isListening ? "text-rose-500 bg-rose-500/10 animate-pulse" : "text-muted-foreground hover:bg-card hover:text-primary"
                  )}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={isListening ? "Sampling Audio..." : "Input command..."}
                className="h-9 sm:h-10 w-full border-none bg-transparent px-2 sm:px-3 text-[13px] font-medium focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>

        <SheetContent side="right" className="w-full sm:min-w-[450px] border-l border-border p-0 overflow-hidden bg-card shadow-2xl">
          <SheetHeader className="p-6 border-b border-border bg-card/50 backdrop-blur-xl">
            <SheetTitle className="text-xl font-headline font-bold text-slate-900">Cognitive Hub</SheetTitle>
            <p className="text-[8px] text-primary font-bold uppercase tracking-[0.2em] mt-0.5">Advanced Parameters</p>
          </SheetHeader>
          <ParameterControls />
        </SheetContent>
      </div>
    </Sheet>
  );
}
