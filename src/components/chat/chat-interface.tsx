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
  WifiOff
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
              <button className="flex items-center gap-3 group transition-all hover:opacity-80">
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
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground">
                  <Settings2 size={16} />
                </Button>
              </SheetTrigger>
              <SidebarTrigger className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          {/* Quick Fine-Tuning Tabs */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('personas')}
                className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-[8px] font-bold uppercase tracking-widest border border-accent/20 hover:bg-accent/20 transition-all shrink-0"
              >
                ID: {persona.name}
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('frameworks')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest border transition-all shrink-0",
                  session.frameworkId 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {framework?.name || "No Framework"}
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button 
                onClick={() => setActiveParameterTab('linguistic')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest border transition-all shrink-0",
                  session.linguisticId 
                    ? "bg-destructive text-destructive-foreground border-destructive" 
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {linguistic?.name || "Logic: Default"}
              </button>
            </SheetTrigger>
          </div>
        </div>

        {/* Main Orchestration Scroll Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
          <div className="mx-auto flex w-full max-w-4xl flex-col py-8 px-4 sm:px-8">
            {session.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Zap size={40} className="text-primary mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-900">Neural Node Ready</p>
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
            
            {/* Adaptive Tool Grid - Mobile Friendly */}
            <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-center gap-2">
              <button 
                onClick={() => toggleTool(session.id, 'webSearch')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
                  session.settings.webSearchEnabled 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Search size={14} />
                <span className="hidden sm:inline">Grounding</span>
              </button>
              
              <button 
                onClick={() => toggleTool(session.id, 'reasoning')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
                  session.settings.reasoningEnabled 
                    ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Brain size={14} />
                <span className="hidden sm:inline">Thinking</span>
              </button>

              <button 
                onClick={() => toggleTool(session.id, 'voice')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
                  session.settings.voiceResponseEnabled 
                    ? "bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/20" 
                    : "bg-background/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {session.settings.voiceResponseEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                <span className="hidden sm:inline">Voice</span>
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
                    isListening ? "text-rose-500 bg-rose-500/10 animate-pulse" : "text-muted-foreground hover:bg-card"
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