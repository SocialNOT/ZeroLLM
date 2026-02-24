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
  Palette
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
    sessionStartTime,
    cycleTheme,
    activeTheme
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

  const themeLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentThemeLabel = activeTheme === 'auto' ? `Auto Sync` : `${themeLabels[Number(activeTheme)]} Logic`;

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
        <Zap className="text-primary mb-4 animate-pulse" size={48} />
        <p className="max-w-xs text-foreground font-black text-[10px] uppercase tracking-widest">
          Initialize a cognitive sequence to begin.
        </p>
      </div>
    );
  }

  return (
    <Sheet>
      <div className="flex h-full w-full flex-col overflow-hidden bg-card relative">
        
        {isGuest && (
          <div className="flex-shrink-0 flex items-center justify-center gap-3 py-1 border-b border-border bg-primary/5 z-30">
            <div className="flex items-center justify-center gap-2 bg-white px-3 py-0.5 rounded-full border-2 border-primary shadow-none animate-multi-color-pulse">
              <span className="text-[7px] font-black uppercase tracking-widest text-primary leading-none mr-1">Session TTL:</span>
              <Clock size={10} className="text-primary" />
              <span className="text-[10px] font-black font-mono tracking-tight text-foreground leading-none">
                {timeLeft}
              </span>
            </div>
            
            <Link href="/auth/login">
              <div className="group flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-primary/10 transition-all active:scale-95 cursor-pointer">
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary leading-none group-hover:underline">
                  Sign In / Sign Up
                </span>
                <LogIn size={10} className="text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        )}

        <div className="flex-shrink-0 flex flex-col border-b border-border px-3 py-2 sm:px-6 sm:py-3 bg-card z-20">
          <div className="flex items-center justify-between gap-4">
            <SettingsDialog>
              <button className="flex items-center gap-2 group transition-all hover:opacity-80 text-left bg-white px-1.5 py-1 rounded-xl border-2 border-border shadow-sm hover:shadow-md hover:border-primary active:scale-95 min-w-[120px] sm:min-w-[160px]">
                <div className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 rounded-[0.75rem] flex items-center justify-center transition-all shadow-inner border-2 shrink-0",
                  connectionStatus === 'online' ? "bg-primary text-white border-primary" : "bg-destructive text-white border-destructive"
                )}>
                  {connectionStatus === 'online' ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
                </div>
                <div className="flex flex-col items-start text-left pr-1 overflow-hidden min-w-0 flex-1">
                  <div className="flex items-center gap-1 leading-none w-full justify-between">
                    <span className={cn(
                      "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.05em] whitespace-nowrap",
                      connectionStatus === 'online' ? "text-primary" : "text-destructive"
                    )}>
                      {connectionStatus === 'online' ? "System Optimal" : "Node Offline"}
                    </span>
                    {mounted && connectionStatus === 'online' && (
                      <span className="text-[6px] sm:text-[7px] font-mono font-black text-foreground">
                        {latency}
                      </span>
                    )}
                  </div>
                  <span className="text-[6px] sm:text-[7px] font-black text-foreground uppercase tracking-wider mt-0.5 truncate w-full">
                    {connection?.modelId || "Primary Engine"}
                  </span>
                </div>
              </button>
            </SettingsDialog>

            {mounted && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 flex-1 overflow-hidden px-2">
                <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-primary whitespace-nowrap">
                  {currentTime?.toLocaleDateString('en-IN', { weekday: 'short' }) || "DAY"}
                </span>
                <div className="bg-white px-2 py-1 rounded border-2 border-border shadow-sm flex items-center justify-center shrink-0">
                  <span className="text-[10px] sm:text-[14px] font-black font-mono tracking-tighter text-foreground leading-none">
                    {currentTime?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) || "00:00:00"}
                  </span>
                </div>
                <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-accent whitespace-nowrap">
                  {currentTime?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) || "DATE"}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1 shrink-0">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => cycleTheme()}
                title={`Cycle Diurnal Theme: ${currentThemeLabel}`}
                className="h-7 w-7 rounded-lg border-2 border-border text-foreground hover:bg-primary hover:text-white transition-all shadow-sm active:scale-90"
              >
                <Palette size={14} />
              </Button>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-2 border-border text-foreground hover:bg-primary hover:text-white transition-colors">
                  <Settings2 size={14} />
                </Button>
              </SheetTrigger>
              <SidebarTrigger className="h-7 w-7 border-2 border-border text-foreground hover:bg-primary hover:text-white transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-3 mt-2 border-2 border-border rounded-lg overflow-hidden bg-primary/5 divide-x-2 divide-border shadow-inner">
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('personas')}
                className="flex flex-col items-center justify-center py-1.5 px-1 hover:bg-accent hover:text-white transition-all group text-center active:scale-95"
              >
                <span className="text-[6px] font-black uppercase tracking-widest text-foreground group-hover:text-white">Identity</span>
                <span className="text-[8px] font-black uppercase truncate w-full mt-0.5">
                  {persona.name}
                </span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('frameworks')}
                className="flex flex-col items-center justify-center py-1.5 px-1 hover:bg-primary hover:text-white transition-all group text-center active:scale-95"
              >
                <span className="text-[6px] font-black uppercase tracking-widest text-foreground group-hover:text-white">Arch</span>
                <span className={cn(
                  "text-[8px] font-black uppercase truncate w-full mt-0.5",
                  session.frameworkId ? "animate-pulse" : ""
                )}>
                  {framework?.name || "None"}
                </span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('linguistic')}
                className="flex flex-col items-center justify-center py-1.5 px-1 hover:bg-destructive hover:text-white transition-all group text-center active:scale-95"
              >
                <span className="text-[6px] font-black uppercase tracking-widest text-foreground group-hover:text-white">Logic</span>
                <span className={cn(
                  "text-[8px] font-black uppercase truncate w-full mt-0.5",
                  session.linguisticId ? "animate-pulse" : ""
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
                  <h2 className="text-xl sm:text-2xl font-headline font-black text-foreground tracking-tight">Neural Node Ready</h2>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Select Cognitive Starter</p>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
                  {cognitiveStarters.map((starter, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setInput(starter.prompt)}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-white border-2 border-border shadow-md hover:shadow-xl hover:border-primary transition-all text-left animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                        {starter.icon}
                      </div>
                      <span className="text-[11px] sm:text-[13px] font-black text-foreground tracking-tight truncate">{starter.title}</span>
                      <ArrowRight size={14} className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <SettingsDialog>
                    <Button variant="outline" className="h-10 rounded-xl gap-2 px-6 text-[9px] font-black uppercase tracking-widest bg-white border-2 border-border shadow-lg hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">
                      <Cpu size={14} />
                      Control
                    </Button>
                  </SettingsDialog>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveParameterTab('frameworks')}
                      className="h-10 rounded-xl gap-2 px-6 text-[9px] font-black uppercase tracking-widest bg-white border-2 border-border shadow-lg hover:bg-accent hover:text-white hover:border-accent transition-all active:scale-95"
                    >
                      <Command size={14} />
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
              <div className="flex items-center gap-2 px-4 py-4 text-[9px] text-primary font-black uppercase tracking-[0.2em] animate-pulse">
                <Brain size={12} className="animate-bounce" />
                Orchestrating...
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-3 sm:p-4 bg-card border-t-2 border-border z-30">
          <div className="mx-auto max-w-4xl space-y-3">
            
            <div className="flex items-center justify-center gap-2 mx-auto w-full sm:w-[66%] overflow-x-auto no-scrollbar">
              <button 
                onClick={() => toggleTool(session.id, 'webSearch')}
                title="Web Grounding"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.webSearchEnabled 
                    ? "bg-primary text-white border-primary shadow-lg scale-110" 
                    : "bg-white text-foreground border-border hover:border-primary"
                )}
              >
                <Search size={14} />
              </button>
              
              <button 
                onClick={() => toggleTool(session.id, 'reasoning')}
                title="Deep Thinking"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.reasoningEnabled 
                    ? "bg-accent text-white border-accent shadow-lg scale-110" 
                    : "bg-white text-foreground border-border hover:border-accent"
                )}
              >
                <Brain size={14} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'voice')}
                title="Voice Synthesis"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.voiceResponseEnabled 
                    ? "bg-destructive text-white border-destructive shadow-lg scale-110" 
                    : "bg-white text-foreground border-border hover:border-destructive"
                )}
              >
                {session.settings.voiceResponseEnabled ? <Mic size={14} /> : <MicOff size={14} />}
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'calculator')}
                title="Mathematical Logic"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.calculatorEnabled 
                    ? "bg-primary text-white border-primary shadow-lg scale-110" 
                    : "bg-white text-foreground border-border hover:border-primary"
                )}
              >
                <Calculator size={14} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'code')}
                title="Code Interpreter"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.codeEnabled 
                    ? "bg-accent text-white border-accent shadow-lg scale-110" 
                    : "bg-white text-foreground border-border hover:border-accent"
                )}
              >
                <Terminal size={14} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'knowledge')}
                title="Knowledge Vault"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg border-2 transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.knowledgeEnabled 
                    ? "bg-destructive text-white border-destructive shadow-lg scale-110" 
                    : "bg-white text-foreground border-border hover:border-destructive"
                )}
              >
                <Database size={14} />
              </button>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="relative flex items-center bg-white hover:bg-primary/5 transition-all rounded-xl sm:rounded-2xl p-1.5 border-2 border-border shadow-xl focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
            >
              <div className="flex shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleMicToggle}
                  className={cn(
                    "h-9 w-9 sm:h-11 sm:w-11 transition-all rounded-lg sm:rounded-xl",
                    isListening ? "text-white bg-destructive animate-pulse" : "text-foreground hover:bg-primary hover:text-white"
                  )}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder={isListening ? "Sampling Audio Node..." : "Input orchestration command..."}
                className="h-9 sm:h-11 w-full border-none bg-transparent px-3 sm:px-4 text-[14px] font-black focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-foreground/40"
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-primary text-white shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 border-2 border-black/5"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>

        <SheetContent side="right" className="w-full sm:min-w-[450px] border-l-2 border-border p-0 overflow-hidden bg-card shadow-2xl">
          <SheetHeader className="p-6 border-b-2 border-border bg-primary/5">
            <SheetTitle className="text-xl font-headline font-black text-foreground">Cognitive Hub</SheetTitle>
            <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-1">Advanced Neural Parameters</p>
          </SheetHeader>
          <ParameterControls />
        </SheetContent>
      </div>
    </Sheet>
  );
}