"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { ChatMessage } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Sparkles, 
  Paperclip, 
  Loader2, 
  Settings2, 
  Wifi, 
  ShieldCheck, 
  Layers,
  ChevronDown,
  X,
  Zap,
  Globe,
  Cpu,
  Activity,
  Database,
  Terminal
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

export function ChatInterface() {
  const { 
    activeSessionId, 
    sessions, 
    addMessage, 
    personas, 
    connections,
    activeConnectionId,
    currentUserRole,
    connectionStatus,
    availableModels,
    updateConnection,
    checkConnection
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const session = sessions.find(s => s.id === activeSessionId);
  const persona = personas.find(p => p.id === session?.personaId) || personas[0];
  const connection = connections.find(c => c.id === activeConnectionId) || connections[0];

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
    setAttachedFile(null);
    setIsTyping(true);

    try {
      const responseContent = await personaDrivenChat({
        baseUrl: connection.baseUrl,
        modelId: connection.modelId,
        systemPrompt: persona.systemPrompt,
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

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-50">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <Activity className="text-primary animate-bounce" size={50} />
          </div>
        </div>
        <h2 className="mb-4 text-4xl font-headline font-bold text-slate-900 tracking-tight">Node Command Initialized</h2>
        <p className="max-w-md text-slate-500 font-medium leading-relaxed opacity-80">
          Select a cognitive thread from the chronicle or initialize a new sequence to begin orchestration.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 p-4 lg:p-6 gap-6">
      <div className="flex flex-col flex-1 gap-6 min-w-0">
        {/* Main Chat Bento Module */}
        <div className="flex flex-col flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6">
            <div className="flex items-center gap-5">
              <SidebarTrigger className="lg:hidden h-10 w-10 text-slate-400 hover:bg-slate-50 rounded-2xl" />
              <div className="flex flex-col">
                <h3 className="text-xl font-headline font-bold text-slate-900 leading-none">{session.title}</h3>
                <span className="mt-2 text-[10px] font-bold text-primary uppercase tracking-[0.25em] opacity-70">{persona.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">
                <ShieldCheck size={14} className="text-primary/70" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentUserRole} Access</span>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                    <Settings2 size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:w-[400px] border-l border-slate-100 p-0 rounded-l-[3rem]">
                  <SheetHeader className="p-10 border-b border-slate-50">
                    <SheetTitle className="text-2xl font-headline font-bold text-slate-900">Module Parameters</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)]">
                    <ParameterControls />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="mx-auto flex w-full max-w-4xl flex-col py-10 px-8">
              {session.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <Terminal size={40} className="mb-6 text-slate-300" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-400">Sequence Standby</p>
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

          <div className="p-8 bg-gradient-to-t from-white via-white to-transparent">
            <div className="mx-auto max-w-3xl">
              <div className="relative bg-slate-50 rounded-[2rem] p-2 transition-all focus-within:ring-4 focus-within:ring-primary/5 border border-slate-100">
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
                    className="h-12 w-12 text-slate-400 hover:text-primary hover:bg-white rounded-2xl transition-all ml-1 shrink-0"
                  >
                    <Paperclip size={20} />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={currentUserRole === 'Viewer' || isTyping}
                    placeholder={currentUserRole === 'Viewer' ? "Restricted Access" : `Direct command...`}
                    className="h-14 w-full border-none bg-transparent px-4 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                    className="h-12 w-12 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all mr-1 shrink-0"
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
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8">
            <Activity size={18} className="text-primary" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Node Status</h4>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol</span>
              <Badge variant="outline" className={cn(
                "text-[9px] font-bold uppercase tracking-widest border-2",
                connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-500 bg-rose-50"
              )}>
                {connectionStatus === 'online' ? "Online" : "Isolated"}
              </Badge>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Endpoint Node</span>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer" onClick={() => setTempUrl(connection.baseUrl)}>
                <Globe size={14} className="text-primary/60 shrink-0" />
                <span className="text-[10px] font-mono font-bold text-slate-600 truncate">{connection.baseUrl.replace(/https?:\/\//, '')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8">
            <Cpu size={18} className="text-primary" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Active Engine</h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700 uppercase tracking-widest justify-between px-5">
                <span className="truncate max-w-[140px]">{connection.modelId || "AUTO SELECT"}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[260px] rounded-[1.5rem] p-2 bg-white/95 backdrop-blur-2xl border-slate-100 shadow-2xl">
              <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Discovered Models</div>
              {availableModels.map(m => (
                <DropdownMenuItem key={m} onClick={() => updateConnection(connection.id, { modelId: m })} className="text-[11px] font-bold rounded-xl py-3 px-4 cursor-pointer">
                  {m}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)] flex-1">
          <div className="flex items-center gap-3 mb-8">
            <Database size={18} className="text-primary" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Cognitive Memory</h4>
          </div>
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-2">Memory Path</span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{session.settings.memoryType} Optimized</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Latency</span>
              <span className="text-xs font-bold text-slate-800">12ms Response</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
