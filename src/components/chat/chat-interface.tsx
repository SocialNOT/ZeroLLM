"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { ChatMessage } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Paperclip, 
  Settings2, 
  ChevronDown,
  Zap,
  Globe,
  Cpu,
  Activity,
  Database,
  Terminal,
  Moon,
  Sun,
  Clock,
  Layers,
  UserCircle,
  PanelRight,
  PanelRightClose,
  Brain,
  Mic,
  MicOff,
  Sparkles,
  Search
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
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { generateChatTitle } from "@/ai/actions/chat-actions";

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
    updateConnection,
    setActiveParameterTab,
    showInfoSidebar,
    toggleInfoSidebar,
    toggleTool
  } = useAppStore();
  
  const { theme, setTheme } = useTheme();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.messages, isTyping]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || !session || isTyping || currentUserRole === 'Viewer') return;

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
        framework ? `\n\n[STRUCTURAL FRAMEWORK: ${framework.name}]\nUse the following structure for your thinking and output:\n${framework.content}` : '',
        linguistic ? `\n\n[LINGUISTIC CONSTRAINTS: ${linguistic.name}]\nAdhere to these rules strictly:\n${linguistic.system_instruction}` : ''
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

      // Handle Auto-Voice if enabled
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
        content: `Protocol Error: ${error.message || 'Node connection failure.'}`,
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
  const formattedDate = currentTime ? currentTime.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : "";

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-transparent">
        <Zap className="text-primary mb-4 animate-pulse" size={48} />
        <p className="max-w-xs text-muted-foreground font-medium text-sm">
          Initialize a cognitive sequence to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col lg:flex-row overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-500 lg:p-4 gap-4">
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-card border-b lg:border border-border lg:rounded-[2rem] shadow-sm relative">
        
        <Sheet>
          <div className="flex flex-col border-b border-border px-4 py-3 sm:px-8 sm:py-5 bg-card/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-xl" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Clock size={10} className="text-primary" />
                    <span className="text-[10px] font-bold text-slate-900 tracking-wider tabular-nums">{formattedTime}</span>
                  </div>
                  <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tight">{formattedDate} • {currentUserRole}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl text-muted-foreground"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("hidden xl:flex h-9 w-9 rounded-xl text-muted-foreground", !showInfoSidebar && "text-primary bg-primary/5")}
                  onClick={toggleInfoSidebar}
                >
                  {showInfoSidebar ? <PanelRight size={18} /> : <PanelRightClose size={18} />}
                </Button>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground">
                    <Settings2 size={18} />
                  </Button>
                </SheetTrigger>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1 pr-4">
              <SheetTrigger asChild>
                <button 
                  onClick={() => setActiveParameterTab('frameworks')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[8px] font-bold uppercase tracking-widest transition-all shrink-0",
                    session.frameworkId 
                      ? "bg-primary text-primary-foreground border-primary shadow-md" 
                      : "bg-muted/50 text-muted-foreground border-border"
                  )}
                >
                  <Layers size={8} />
                  {framework?.name || "Framework: Standard"}
                </button>
              </SheetTrigger>

              <SheetTrigger asChild>
                <button 
                  onClick={() => setActiveParameterTab('personas')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground border border-accent shadow-md text-[8px] font-bold uppercase tracking-widest shrink-0"
                >
                  <UserCircle size={8} />
                  Persona: {persona.name}
                </button>
              </SheetTrigger>

              <SheetTrigger asChild>
                <button 
                  onClick={() => setActiveParameterTab('linguistic')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[8px] font-bold uppercase tracking-widest transition-all shrink-0",
                    session.linguisticId 
                      ? "bg-destructive text-destructive-foreground border-destructive shadow-md" 
                      : "bg-muted/50 text-muted-foreground border-border"
                  )}
                >
                  <Cpu size={8} />
                  {linguistic?.name || "Logic: Default"}
                </button>
              </SheetTrigger>
              
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 text-muted-foreground border border-border text-[8px] font-bold uppercase tracking-widest shrink-0">
                <Terminal size={8} />
                {connection.modelId || "Auto"}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="mx-auto flex w-full max-w-4xl flex-col py-6 sm:py-10 px-4 sm:px-8">
              {session.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 opacity-20">
                  <div className="p-8 rounded-[3rem] bg-muted mb-6">
                    <Zap size={48} className="text-primary" />
                  </div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.5em] text-slate-900">Neural Node Idle</p>
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] mt-2 text-slate-400">Awaiting cognitive input</p>
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
                <div className="flex items-center gap-3 px-4 py-8 text-[10px] text-primary font-bold uppercase tracking-[0.3em]">
                  <div className="flex gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                  Computing Response
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>
          </ScrollArea>

          <div className="p-4 sm:p-8 bg-card/80 backdrop-blur-xl border-t lg:border-none z-20">
            <div className="mx-auto max-w-3xl space-y-4">
              
              {/* Companion Toolbar */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-2">
                <button 
                  onClick={() => toggleTool(session.id, 'webSearch')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                    session.settings.webSearchEnabled 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background/50 text-muted-foreground border-border hover:border-primary/50"
                  )}
                >
                  <Search size={12} />
                  Grounding
                </button>
                
                <button 
                  onClick={() => toggleTool(session.id, 'reasoning')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                    session.settings.reasoningEnabled 
                      ? "bg-accent text-accent-foreground border-accent" 
                      : "bg-background/50 text-muted-foreground border-border hover:border-accent/50"
                  )}
                >
                  <Brain size={12} />
                  Thinking
                </button>

                <button 
                  onClick={() => toggleTool(session.id, 'voice')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                    session.settings.voiceResponseEnabled 
                      ? "bg-destructive text-destructive-foreground border-destructive" 
                      : "bg-background/50 text-muted-foreground border-border hover:border-destructive/50"
                  )}
                >
                  {session.settings.voiceResponseEnabled ? <Mic size={12} /> : <MicOff size={12} />}
                  Voice
                </button>

                <div className="h-4 w-px bg-border mx-1" />

                <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/30 text-muted-foreground border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted/50 transition-all">
                  <Sparkles size={12} />
                  Visual
                </button>
              </div>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                className="relative flex items-center bg-muted/50 hover:bg-muted transition-colors rounded-2xl sm:rounded-[2.5rem] p-1.5 sm:p-2.5 border border-border shadow-2xl shadow-black/5"
              >
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 sm:h-14 sm:w-14 text-muted-foreground hover:bg-card rounded-xl sm:rounded-3xl shrink-0"
                >
                  <Paperclip size={20} />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={currentUserRole === 'Viewer' || isTyping}
                  placeholder="Direct command..."
                  className="h-10 sm:h-14 w-full border-none bg-transparent px-2 sm:px-6 text-[15px] font-medium focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                  className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                >
                  <Send size={20} />
                </Button>
              </form>
            </div>
          </div>

          <SheetContent side="right" className="w-full sm:min-w-[500px] border-l border-border p-0 overflow-hidden bg-card shadow-2xl">
            <SheetHeader className="p-8 sm:p-12 border-b border-border bg-card/50 backdrop-blur-xl">
              <SheetTitle className="text-2xl sm:text-3xl font-headline font-bold text-slate-900">Module Parameters</SheetTitle>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mt-1">Cognitive Fine-Tuning Node</p>
            </SheetHeader>
            <ParameterControls />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Info Sidebar */}
      {showInfoSidebar && (
        <div className="hidden xl:flex flex-col w-[320px] gap-4 shrink-0 h-full animate-in slide-in-from-right duration-500 ease-out">
          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Activity size={18} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Node Status</h4>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol</span>
                <Badge variant="outline" className={cn(
                  "text-[9px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full",
                  connectionStatus === 'online' ? "border-emerald-500/20 text-emerald-500 bg-emerald-50/5" : "border-rose-500/20 text-rose-500 bg-rose-50/5"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full mr-2", connectionStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                  {connectionStatus}
                </Badge>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Endpoint Node</span>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border text-[10px] font-code break-all flex items-center gap-3">
                  <Globe size={12} className="text-primary shrink-0" />
                  {connection.baseUrl.replace(/https?:\/\//, '')}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-8">
              <Cpu size={18} className="text-primary" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Active Engine</h4>
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] block">Inference Module</span>
                <span className="text-[13px] font-bold text-slate-900 block bg-muted/50 p-4 rounded-2xl border border-border truncate">
                  {connection.modelId || "Automatic Detection"}
                </span>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] block">Cognitive Memory</span>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 border border-border">
                  <Database size={14} className="text-primary" />
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">{session.settings.memoryType} Path</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}