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
  ShieldCheck, 
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
  Wifi,
  WifiOff,
  Layers,
  UserCircle
} from "lucide-react";
import { personaDrivenChat } from "@/ai/flows/persona-driven-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
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
    availableModels,
    updateConnection,
    checkConnection,
    activeParameterTab,
    setActiveParameterTab
  } = useAppStore();
  
  const { theme, setTheme } = useTheme();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
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
        enabledTools: session.settings.enabledTools
      });

      addMessage(session.id, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: Date.now()
      });
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

  const handleUpdateUrl = async () => {
    if (connection && tempUrl) {
      updateConnection(connection.id, { baseUrl: tempUrl });
      await checkConnection();
      toast({ title: "Node Updated", description: `Target synchronized: ${tempUrl}` });
    }
  };

  const formattedTime = currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

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
    <div className="flex h-full w-full flex-col lg:flex-row overflow-hidden bg-card/50 backdrop-blur-sm transition-colors duration-500 lg:p-4 gap-4">
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-card border-b lg:border border-border lg:rounded-[2rem] shadow-sm">
        
        <Sheet>
          <div className="flex flex-col border-b border-border px-4 py-3 sm:px-8 sm:py-5 bg-card/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-xl" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase truncate max-w-[120px]">
                    {session.title}
                  </span>
                  <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-tight">{formattedTime} • {currentUserRole}</span>
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
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground">
                    <Settings2 size={18} />
                  </Button>
                </SheetTrigger>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
              <SheetTrigger asChild>
                <button 
                  onClick={() => setActiveParameterTab('frameworks')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-bold uppercase tracking-widest transition-all shrink-0",
                    session.frameworkId 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-muted/50 text-muted-foreground border-border"
                  )}
                >
                  <Layers size={8} />
                  {framework?.name || "No Framework"}
                </button>
              </SheetTrigger>

              <SheetTrigger asChild>
                <button 
                  onClick={() => setActiveParameterTab('personas')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-accent text-[8px] font-bold uppercase tracking-widest shrink-0"
                >
                  <UserCircle size={8} />
                  {persona.name}
                </button>
              </SheetTrigger>

              <SheetTrigger asChild>
                <button 
                  onClick={() => setActiveParameterTab('linguistic')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-bold uppercase tracking-widest transition-all shrink-0",
                    session.linguisticId 
                      ? "bg-destructive text-destructive-foreground border-destructive" 
                      : "bg-muted/50 text-muted-foreground border-border"
                  )}
                >
                  <Cpu size={8} />
                  {linguistic?.name || "Logic: Standard"}
                </button>
              </SheetTrigger>
            </div>
          </div>

          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="mx-auto flex w-full max-w-3xl flex-col py-6 sm:py-10 px-4 sm:px-8">
              {session.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <Terminal size={32} className="mb-4 text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Node Idle</p>
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
                <div className="flex items-center gap-3 px-4 py-6 text-[10px] text-primary font-bold uppercase tracking-[0.2em]">
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce" />
                  </div>
                  Computing
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>
          </ScrollArea>

          <div className="p-4 sm:p-8 bg-card border-t lg:border-none">
            <div className="mx-auto max-w-2xl">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                className="relative flex items-center bg-muted rounded-2xl sm:rounded-[2rem] p-1.5 sm:p-2 border border-border"
              >
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground hover:bg-card rounded-xl sm:rounded-2xl shrink-0"
                >
                  <Paperclip size={18} />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={currentUserRole === 'Viewer' || isTyping}
                  placeholder="Direct command..."
                  className="h-10 sm:h-14 w-full border-none bg-transparent px-2 sm:px-4 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground shrink-0"
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </div>

          <SheetContent side="right" className="w-full sm:min-w-[450px] border-l border-border p-0 overflow-hidden bg-card">
            <SheetHeader className="p-6 sm:p-10 border-b border-border bg-card">
              <SheetTitle className="text-xl sm:text-2xl font-headline font-bold">Module Parameters</SheetTitle>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Cognitive Fine-Tuning</p>
            </SheetHeader>
            <ParameterControls />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Info Sidebar */}
      <div className="hidden xl:flex flex-col w-[280px] gap-4 shrink-0 h-full">
        <div className="bg-card rounded-[2rem] p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Activity size={16} className="text-primary" />
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Status</h4>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Node</span>
            <Badge variant="outline" className={cn(
              "text-[8px] font-bold uppercase tracking-widest py-0.5 px-2",
              connectionStatus === 'online' ? "border-emerald-500/20 text-emerald-500 bg-emerald-50/5" : "border-rose-500/20 text-rose-500 bg-rose-50/5"
            )}>
              {connectionStatus}
            </Badge>
          </div>
          <div className="p-3 rounded-xl bg-muted border border-border text-[9px] font-mono truncate">
            {connection.baseUrl.replace(/https?:\/\//, '')}
          </div>
        </div>

        <div className="bg-card rounded-[2rem] p-6 border border-border shadow-sm flex-1">
          <div className="flex items-center gap-3 mb-6">
            <Database size={16} className="text-primary" />
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Telemetry</h4>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-muted-foreground uppercase block">Active Engine</span>
              <span className="text-[10px] font-bold block truncate">{connection.modelId || "Auto"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-muted-foreground uppercase block">Memory Path</span>
              <span className="text-[10px] font-bold block">{session.settings.memoryType}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}