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
  UserCircle
} from "lucide-react";
import { personaDrivenChat } from "@/ai/flows/persona-driven-chat";
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

export function ChatInterface() {
  const { 
    activeSessionId, 
    sessions, 
    addMessage, 
    updateSession,
    personas, 
    frameworks,
    linguisticControls,
    connections,
    activeConnectionId,
    currentUserRole,
    connectionStatus,
    setActiveParameterTab,
    toggleTool
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const session = sessions.find(s => s.id === activeSessionId);
  const persona = personas.find(p => p.id === session?.personaId) || personas[0];
  const framework = frameworks.find(f => f.id === session?.frameworkId);
  const linguistic = linguisticControls.find(l => l.id === session?.linguisticId);
  const connection = connections.find(c => c.id === activeConnectionId) || connections[0];

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
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
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [session?.messages?.length, isTyping]);

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
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || !session || isTyping || currentUserRole === 'Viewer') return;

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

    try {
      const combinedSystemPrompt = [
        `You are acting as: ${persona.name}. ${persona.system_prompt}`,
        framework ? `\n\n[STRUCTURAL FRAMEWORK: ${framework.name}]\n${framework.content}` : '',
        linguistic ? `\n\n[LINGUISTIC CONSTRAINTS: ${linguistic.name}]\n${linguistic.system_instruction}` : ''
      ].filter(Boolean).join('\n\n').trim();
      
      const responseContent = await personaDrivenChat({
        baseUrl: connection.baseUrl,
        modelId: connection.modelId,
        systemPrompt: combinedSystemPrompt,
        userMessage: textToSend,
        temperature: session.settings.temperature,
        topP: session.settings.topP,
        maxTokens: session.settings.maxTokens,
        history: session.messages,
        enabledTools: session.settings.enabledTools,
        reasoningEnabled: session.settings.reasoningEnabled
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: responseContent,
        timestamp: Date.now()
      };

      addMessage(session.id, assistantMsg);

      if (session.settings.voiceResponseEnabled) {
        try {
          const { audioUri } = await generateSpeech({ text: responseContent });
          const audio = new Audio(audioUri);
          audio.play();
        } catch (vErr) {
          console.warn("Voice auto-play failed", vErr);
        }
      }

    } catch (error: any) {
      addMessage(session.id, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `ERROR: ${error.message || 'Node connection failure.'}`,
        timestamp: Date.now()
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

  const formattedTime = currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

  const cognitiveStarters = [
    { 
      title: "Analytical Depth", 
      description: "Apply First Principles thinking", 
      prompt: "Apply First Principles thinking to analyze: ",
      icon: <Brain size={16} className="text-primary" />
    },
    { 
      title: "Technical Audit", 
      description: "Perform a STRIDE threat model", 
      prompt: "Perform a STRIDE threat model on: ",
      icon: <Shield size={16} className="text-destructive" />
    },
    { 
      title: "Code Architect", 
      description: "Design type-safe systems", 
      prompt: "Help me architect a high-performance system in Rust that: ",
      icon: <Terminal size={16} className="text-accent" />
    },
    { 
      title: "Knowledge Discovery", 
      description: "Scan local documentation", 
      prompt: "Search the internal knowledge base for: ",
      icon: <Database size={16} className="text-primary" />
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
        
        {/* Interactive System Status Header */}
        <div className="flex-shrink-0 flex flex-col border-b border-border px-4 py-3 sm:px-8 sm:py-4 bg-card/90 backdrop-blur-xl z-20">
          <div className="flex items-center justify-between gap-4">
            <SettingsDialog>
              <button className="flex items-center gap-3 group transition-all hover:opacity-80 text-left">
                <div className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center transition-all shadow-lg",
                  connectionStatus === 'online' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                )}>
                  {connectionStatus === 'online' ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest leading-none">
                    {connectionStatus === 'online' ? "System Optimal" : "Node Offline"}
                  </span>
                  <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-tight mt-1">
                    {connection.modelId || "unspecified"} • {formattedTime}
                  </span>
                </div>
              </button>
            </SettingsDialog>
            
            <div className="flex items-center gap-1">
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                  <Settings2 size={16} />
                </Button>
              </SheetTrigger>
              <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-primary transition-colors" />
            </div>
          </div>

          {/* Quick Fine-Tuning Grid Module - Animated with Pulse Glow */}
          <div className="grid grid-cols-3 mt-4 border border-border rounded-xl overflow-hidden bg-muted/5 divide-x divide-border shadow-inner">
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('personas')}
                className="flex flex-col items-center justify-center py-2.5 px-2 hover:bg-accent/10 transition-all group text-center active:scale-95"
              >
                <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-accent transition-colors">Identity</span>
                <span className="text-[9px] font-bold text-accent uppercase truncate w-full mt-0.5 animate-pulse-glow">
                  {persona.name}
                </span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('frameworks')}
                className="flex flex-col items-center justify-center py-2.5 px-2 hover:bg-primary/10 transition-all group text-center active:scale-95"
              >
                <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary transition-colors">Architecture</span>
                <span className={cn(
                  "text-[9px] font-bold uppercase truncate w-full mt-0.5",
                  session.frameworkId ? "text-primary animate-pulse-glow" : "text-muted-foreground/40"
                )}>
                  {framework?.name || "None"}
                </span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('linguistic')}
                className="flex flex-col items-center justify-center py-2.5 px-2 hover:bg-destructive/10 transition-all group text-center active:scale-95"
              >
                <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-destructive transition-colors">Logic</span>
                <span className={cn(
                  "text-[9px] font-bold uppercase truncate w-full mt-0.5",
                  session.linguisticId ? "text-destructive animate-pulse-glow" : "text-muted-foreground/40"
                )}>
                  {linguistic?.name || "Default"}
                </span>
              </button>
            </SheetTrigger>
          </div>
        </div>

        {/* Main Orchestration Scroll Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
          <div className="mx-auto flex w-full max-w-4xl flex-col py-8 px-4 sm:px-8">
            {session.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-0">
                <div className="relative mb-12">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative h-20 w-20 rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl flex items-center justify-center text-primary group transition-transform hover:scale-110">
                    <Zap size={40} fill="currentColor" className="animate-pulse" />
                  </div>
                </div>
                
                <div className="text-center mb-12 space-y-2">
                  <h2 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Neural Node Ready</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Initialize cognitive sequence</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {cognitiveStarters.map((starter, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setInput(starter.prompt)}
                      className="group flex flex-col items-start p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all text-left relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-2xl bg-slate-50 group-hover:bg-primary/5 transition-colors">
                          {starter.icon}
                        </div>
                        <span className="text-[13px] font-bold text-slate-900 tracking-tight">{starter.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{starter.description}</p>
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <ArrowRight size={16} className="text-primary" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-16 flex items-center gap-4">
                  <SettingsDialog>
                    <Button variant="outline" className="h-12 rounded-2xl gap-3 px-6 text-[10px] font-bold uppercase tracking-[0.2em] bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all">
                      <Cpu size={16} className="text-primary" />
                      System Control
                    </Button>
                  </SettingsDialog>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveParameterTab('frameworks')}
                      className="h-12 rounded-2xl gap-3 px-6 text-[10px] font-bold uppercase tracking-[0.2em] bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all"
                    >
                      <Command size={16} className="text-accent" />
                      Cognitive Hub
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
            {isTyping && (
              <div className="flex items-center gap-3 px-4 py-6 text-[9px] text-primary font-bold uppercase tracking-[0.3em] animate-pulse">
                <Brain size={12} className="animate-bounce" />
                Processing Cognitive Pulse...
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Blazing Fast Command Module */}
        <div className="flex-shrink-0 p-4 sm:p-8 bg-card/90 backdrop-blur-2xl border-t border-border/50 z-30">
          <div className="mx-auto max-w-3xl space-y-4">
            
            {/* Neural Tool Strip - Single Line Icon Set (2/3 width) */}
            <div className="flex items-center justify-center gap-3 mx-auto w-full sm:w-[66%] overflow-x-auto no-scrollbar">
              <button 
                onClick={() => toggleTool(session.id, 'webSearch')}
                title="Web Grounding"
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.webSearchEnabled 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Search size={16} />
              </button>
              
              <button 
                onClick={() => toggleTool(session.id, 'reasoning')}
                title="Deep Thinking"
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.reasoningEnabled 
                    ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Brain size={16} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'voice')}
                title="Voice Synthesis"
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.voiceResponseEnabled 
                    ? "bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {session.settings.voiceResponseEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'calculator')}
                title="Mathematical Logic"
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.calculatorEnabled 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Calculator size={16} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'code')}
                title="Code Interpreter"
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.codeEnabled 
                    ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Terminal size={16} />
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'knowledge')}
                title="Knowledge Vault"
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl border transition-all shrink-0 hover:scale-110 active:scale-95",
                  session.settings.knowledgeEnabled 
                    ? "bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/20 scale-110" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Database size={16} />
              </button>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="relative flex items-center bg-muted/50 hover:bg-muted transition-all rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 border border-border shadow-xl focus-within:ring-2 focus-within:ring-primary/20"
            >
              <div className="flex shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleMicToggle}
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 transition-all rounded-xl sm:rounded-2xl",
                    isListening ? "text-rose-500 bg-rose-500/10 animate-pulse" : "text-muted-foreground hover:bg-card hover:text-primary"
                  )}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={currentUserRole === 'Viewer' || isTyping}
                placeholder={isListening ? "Sampling Neural Audio..." : "Input cognitive command..."}
                className="h-10 sm:h-12 w-full border-none bg-transparent px-3 sm:px-4 text-[14px] font-medium focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>
        </div>

        <SheetContent side="right" className="w-full sm:min-w-[450px] border-l border-border p-0 overflow-hidden bg-card shadow-2xl">
          <SheetHeader className="p-8 border-b border-border bg-card/50 backdrop-blur-xl">
            <SheetTitle className="text-2xl font-headline font-bold text-slate-900">Cognitive Hub</SheetTitle>
            <p className="text-[9px] text-primary font-bold uppercase tracking-[0.3em] mt-1">Advanced Node Parameters</p>
          </SheetHeader>
          <ParameterControls />
        </SheetContent>
      </div>
    </Sheet>
  );
}
