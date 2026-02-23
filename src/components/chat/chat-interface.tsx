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
  Cpu
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
        content: `System Error: ${error.message || 'Unable to process request.'}`,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      toast({ title: "File attached", description: file.name });
    }
  };

  const handleUpdateUrl = async () => {
    if (connection && tempUrl) {
      updateConnection(connection.id, { baseUrl: tempUrl });
      await checkConnection();
      toast({ title: "Endpoint Updated", description: `Target set to ${tempUrl}` });
    }
  };

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-background">
        <div className="md:hidden absolute top-4 left-4">
          <SidebarTrigger />
        </div>
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white border border-slate-100 shadow-2xl">
            <Zap className="text-primary animate-pulse" size={40} fill="currentColor" />
          </div>
        </div>
        <h2 className="mb-3 text-3xl font-headline font-bold text-slate-900 px-4">Ready for Orchestration</h2>
        <p className="max-w-md text-sm text-slate-500 font-medium leading-relaxed px-4 opacity-70">
          Initialize a secure bridge to your local AI engine or select an active session from your chronicle.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Refined Prism Header */}
      <div className="flex items-center justify-between border-b border-slate-100/50 bg-white/60 px-4 md:px-6 py-3 backdrop-blur-2xl z-20">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9 text-slate-500 md:hidden hover:bg-slate-100 rounded-xl" />
          
          <div className="flex items-center gap-2 group cursor-help">
            <div className={cn(
              "h-2 w-2 rounded-full transition-all duration-500",
              connectionStatus === 'online' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
              connectionStatus === 'checking' ? "bg-amber-400 animate-pulse" : "bg-rose-500"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:inline">
              {connectionStatus === 'online' ? "Node Isolated" : 
               connectionStatus === 'checking' ? "Synchronizing" : "Node Offline"}
            </span>
          </div>

          <div className="hidden sm:block h-5 w-[1px] bg-slate-200/50 mx-2" />
          
          <Popover>
            <PopoverTrigger asChild>
              <div 
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                onClick={() => setTempUrl(connection?.baseUrl || "")}
              >
                <Globe size={12} className="text-primary/60" />
                <span className="text-[10px] font-mono font-bold text-slate-500 truncate max-w-[140px]">
                  {connection?.baseUrl.replace(/https?:\/\//, '')}
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-5 rounded-[2rem] shadow-2xl border-white/40 bg-white/90 backdrop-blur-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Protocol Endpoint</div>
                  <Badge variant="secondary" className="text-[8px] h-4 font-bold">V1 API</Badge>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={tempUrl} 
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="h-10 rounded-xl border-slate-200 bg-white font-mono text-xs focus:ring-primary/20"
                  />
                  <Button 
                    size="sm" 
                    className="h-10 rounded-xl bg-primary px-4 text-[10px] font-bold uppercase tracking-widest" 
                    onClick={handleUpdateUrl}
                  >
                    Link
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 px-3 rounded-full border-slate-200 bg-white/50 hover:bg-white text-[10px] font-bold text-slate-600 gap-2 transition-all">
                <Cpu size={12} className="text-primary/70" />
                <span className="max-w-[100px] truncate">{connection?.modelId || "AUTO"}</span>
                <ChevronDown size={10} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px] rounded-[1.5rem] p-2 bg-white/95 backdrop-blur-2xl border-slate-100 shadow-2xl">
              <div className="px-3 py-2 mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                Discovered Engines
              </div>
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <DropdownMenuItem 
                    key={model} 
                    onClick={() => updateConnection(connection.id, { modelId: model })}
                    className={cn(
                      "text-xs font-bold rounded-xl cursor-pointer py-2.5 px-3 transition-colors",
                      model === connection.modelId ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      {model === connection.modelId && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-lg" />}
                      <span className="truncate">{model}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-[10px] text-slate-400 font-bold italic mb-3">No models indexed</p>
                  <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold uppercase tracking-widest text-primary" onClick={() => checkConnection()}>
                    Sync Node
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 border border-slate-200/50">
            <ShieldCheck size={12} className="text-primary/70" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentUserRole}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-5 bg-white z-10">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10 shrink-0">
            <Layers size={22} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-lg font-headline font-bold text-slate-900 leading-none truncate">{session.title}</h3>
            <span className="mt-1.5 text-[10px] font-bold text-primary uppercase tracking-[0.2em] opacity-60 truncate">{persona.name}</span>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all">
              <Settings2 size={16} />
              <span className="hidden sm:inline">Engine Config</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[380px] border-l border-slate-100 bg-white p-0">
            <SheetHeader className="p-8 border-b border-slate-50">
              <SheetTitle className="text-xl font-headline font-bold text-slate-900">Engine Parameters</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)]">
              <ParameterControls />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <ScrollArea className="flex-1 px-4 md:px-6 custom-scrollbar">
        <div className="mx-auto flex w-full max-w-4xl flex-col py-10">
          {session.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-6 h-16 w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
              <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-400 animate-pulse">Neural Pathway Open</p>
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
            <div className="flex items-center gap-4 px-8 py-8 text-[11px] text-primary font-bold uppercase tracking-widest animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              Processing Sequence...
            </div>
          )}
          <div ref={scrollRef} className="h-8" />
        </div>
      </ScrollArea>

      {/* Floating Input Area */}
      <div className="p-6 md:p-10 bg-gradient-to-t from-background via-background/80 to-transparent z-10">
        <div className="mx-auto max-w-4xl">
          <div className="relative glass-panel rounded-[2.5rem] p-1.5 transition-all focus-within:ring-4 focus-within:ring-primary/10">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
              {attachedFile && (
                <div className="absolute -top-14 left-4 flex items-center gap-3 px-4 py-2 bg-white border border-primary/20 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-1 rounded bg-primary/10 text-primary">
                    <Paperclip size={12} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">{attachedFile.name}</span>
                  <button type="button" onClick={() => setAttachedFile(null)} className="ml-1 text-slate-300 hover:text-rose-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 w-11 text-slate-400 hover:text-primary hover:bg-white rounded-full transition-all"
                >
                  <Paperclip size={20} />
                </Button>
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={currentUserRole === 'Viewer' || isTyping}
                placeholder={currentUserRole === 'Viewer' ? "Restricted Access" : `Direct command to ${persona.name}...`}
                className="h-14 w-full rounded-[2rem] border-none bg-transparent pl-14 pr-16 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button 
                  type="submit" 
                  disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                  className="h-11 w-11 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={20} />
                </Button>
              </div>
            </form>
          </div>
          <div className="mt-5 flex items-center justify-center gap-6 opacity-30 select-none">
            <span className="text-[8px] font-bold uppercase tracking-[0.4em]">Node ISO-27001</span>
            <div className="h-1 w-1 rounded-full bg-slate-400" />
            <span className="text-[8px] font-bold uppercase tracking-[0.4em]">Zero-Latency</span>
            <div className="h-1 w-1 rounded-full bg-slate-400" />
            <span className="text-[8px] font-bold uppercase tracking-[0.4em]">E2E Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}