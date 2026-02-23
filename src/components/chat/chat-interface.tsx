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
  Clock
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

export function ChatInterface() {
  const { 
    activeSessionId, 
    sessions, 
    addMessage, 
    personas, 
    frameworks,
    connections,
    activeConnectionId,
    currentUserRole,
    connectionStatus,
    availableModels,
    updateConnection,
    checkConnection
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
      const activeSystemPrompt = framework ? framework.systemPrompt : persona.systemPrompt;
      
      const responseContent = await personaDrivenChat({
        baseUrl: connection.baseUrl,
        modelId: connection.modelId,
        systemPrompt: activeSystemPrompt,
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

  const formattedTime = currentTime ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "";
  const formattedDate = currentTime ? currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "";

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-background">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-card border border-border shadow-[0_20px_50px_rgba(0,0,0,0.06)] glow-multi">
            <Zap className="text-primary animate-bounce" size={50} />
          </div>
        </div>
        <h2 className="logo-shimmer mb-4 text-5xl font-headline font-bold tracking-tight">ZEROGPT</h2>
        <p className="max-w-md text-muted-foreground font-medium leading-relaxed opacity-80">
          Select a cognitive thread from the chronicle or initialize a new sequence to begin orchestration.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background p-4 lg:p-6 gap-6 transition-colors duration-500">
      <div className="flex flex-col flex-1 gap-6 min-w-0">
        {/* Main Chat Bento Module */}
        <div className="flex flex-col flex-1 bg-card rounded-[2.5rem] border border-border shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-8 py-6 bg-card/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-5">
              <SidebarTrigger className="lg:hidden h-10 w-10 text-muted-foreground hover:bg-muted rounded-2xl" />
              <div className="flex flex-col">
                <h3 className="logo-shimmer text-3xl font-headline font-bold leading-none tracking-tighter">ZEROGPT</h3>
                <div className="h-[2px] w-full bg-gradient-to-r from-primary via-accent to-transparent mt-1.5 rounded-full" />
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] block mt-1.5 ml-0.5 truncate max-w-[200px]">
                  {session.title}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[8px] font-bold text-primary uppercase tracking-widest border-primary/20 bg-primary/5">
                    {framework?.name || persona.name}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Sleek Date/Time Display */}
              <div className="hidden md:flex flex-col items-end text-right border-r border-border pr-6">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-primary/70" />
                  <span className="text-[14px] font-code font-bold text-primary leading-tight tracking-widest">{formattedTime}</span>
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-900" />}
                </Button>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted border border-border">
                  <ShieldCheck size={14} className="text-primary/70" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{currentUserRole} Access</span>
                </div>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                      <Settings2 size={20} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:min-w-[450px] border-l border-border p-0 rounded-l-[3rem] overflow-hidden bg-card">
                    <SheetHeader className="p-10 border-b border-border bg-card">
                      <SheetTitle className="text-2xl font-headline font-bold">Module Parameters</SheetTitle>
                      <p className="text-xs text-muted-foreground font-medium">Fine-tune frameworks, personas, and linguistic logic.</p>
                    </SheetHeader>
                    <ParameterControls />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="mx-auto flex w-full max-w-4xl flex-col py-10 px-8">
              {session.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <Terminal size={40} className="mb-6 text-muted-foreground" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-muted-foreground">Sequence Standby</p>
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
                <div className="flex items-center gap-4 px-10 py-10 text-[11px] text-primary font-bold uppercase tracking-[0.3em] animate-pulse">
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 rounded-full bg-primary animate-bounce" />
                  </div>
                  Computing Response
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>
          </ScrollArea>

          <div className="p-8 bg-gradient-to-t from-card via-card to-transparent">
            <div className="mx-auto max-w-3xl">
              <div className="relative bg-muted rounded-[2rem] p-2 transition-all focus-within:ring-4 focus-within:ring-primary/5 border border-border glow-multi">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-12 w-12 text-muted-foreground hover:text-primary hover:bg-card rounded-2xl transition-all ml-1 shrink-0"
                  >
                    <Paperclip size={20} />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={currentUserRole === 'Viewer' || isTyping}
                    placeholder={currentUserRole === 'Viewer' ? "Restricted Access" : `Direct command...`}
                    className="h-14 w-full border-none bg-transparent px-4 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                    className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all mr-1 shrink-0 glow-multi"
                  >
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Bento Diagnostic Tiles */}
      <div className="hidden xl:flex flex-col w-[300px] gap-6 shrink-0">
        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8">
            <Activity size={18} className="text-primary" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Node Status</h4>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol</span>
              <Badge variant="outline" className={cn(
                "text-[9px] font-bold uppercase tracking-widest border-2",
                connectionStatus === 'online' ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-rose-500/20 text-rose-500 bg-rose-50/5"
              )}>
                {connectionStatus === 'online' ? "Online" : "Isolated"}
              </Badge>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <div className="space-y-2 cursor-pointer group">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3 group-hover:text-primary transition-colors">Endpoint Node</span>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted border border-border group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                    <Globe size={14} className="text-primary/60 shrink-0" />
                    <span className="text-[10px] font-mono font-bold text-foreground truncate">{connection.baseUrl.replace(/https?:\/\//, '')}</span>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] rounded-[2rem] p-6 shadow-2xl border-border bg-card">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Update Signal Target</h4>
                <div className="space-y-4">
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input 
                      value={tempUrl} 
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="http://..." 
                      className="pl-12 rounded-xl text-xs h-10 border-border bg-muted"
                    />
                  </div>
                  <Button onClick={handleUpdateUrl} className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Sync Node</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8">
            <Cpu size={18} className="text-primary" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Active Engine</h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-12 rounded-2xl border-border bg-muted text-[10px] font-bold uppercase tracking-widest justify-between px-5 hover:bg-card hover:border-primary/30 transition-all">
                <span className="truncate max-w-[140px]">{connection.modelId || "AUTO SELECT"}</span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[260px] rounded-[1.5rem] p-2 bg-card/95 backdrop-blur-2xl border-border shadow-2xl">
              <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground border-b border-border">Discovered Models</div>
              {availableModels.length > 0 ? (
                availableModels.map(m => (
                  <DropdownMenuItem key={m} onClick={() => updateConnection(connection.id, { modelId: m })} className="text-[11px] font-bold rounded-xl py-3 px-4 cursor-pointer hover:bg-primary/5 hover:text-primary">
                    {m}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-8 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No models found</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-[0_8px_40px_rgba(0,0,0,0.04)] flex-1">
          <div className="flex items-center gap-3 mb-8">
            <Database size={18} className="text-primary" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Cognitive Memory</h4>
          </div>
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-2">Memory Path</span>
              <span className="text-xs font-bold uppercase tracking-tight">{session.settings.memoryType} Optimized</span>
            </div>
            <div className="p-5 rounded-2xl bg-muted border border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Signal Latency</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">12ms Handshake</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}