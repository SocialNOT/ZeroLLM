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
  Menu
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
import { ParameterControls } from "./parameter-controls";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function ChatInterface() {
  const { 
    activeSessionId, 
    sessions, 
    addMessage, 
    personas, 
    connections,
    activeConnectionId,
    currentUserRole,
    connectionStatus 
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const session = sessions.find(s => s.id === activeSessionId);
  const persona = personas.find(p => p.id === session?.personaId) || personas[0];
  const connection = connections.find(c => c.id === activeConnectionId) || connections[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session || isTyping || currentUserRole === 'Viewer') return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
      timestamp: Date.now()
    };

    addMessage(session.id, userMsg);
    setInput("");
    setIsTyping(true);

    try {
      const responseContent = await personaDrivenChat({
        baseUrl: connection.baseUrl,
        modelId: connection.modelId,
        systemPrompt: persona.systemPrompt,
        userMessage: input,
        temperature: session.settings.temperature,
        topP: session.settings.topP,
        maxTokens: session.settings.maxTokens,
        history: session.messages
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

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-50/30">
        <div className="md:hidden absolute top-4 left-4">
          <SidebarTrigger />
        </div>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5 border border-primary/10">
          <Sparkles className="text-primary animate-pulse" size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900 px-4">Experience Intelligent Orchestration</h2>
        <p className="max-w-md text-sm text-slate-500 leading-relaxed px-4">
          Select a workspace or start a new conversation to interface with your professional AI engines.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Dynamic Status Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 bg-white/50 px-4 md:px-6 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger className="h-8 w-8 text-slate-500 md:hidden" />
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              connectionStatus === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : 
              connectionStatus === 'checking' ? "bg-amber-400 animate-pulse" : "bg-rose-500"
            )} />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">
              {connectionStatus === 'online' ? "Engine Online" : 
               connectionStatus === 'checking' ? "Syncing..." : "Offline"}
            </span>
          </div>
          <div className="hidden sm:block h-4 w-[1px] bg-slate-200" />
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
            <Wifi size={10} />
            {connection?.baseUrl.replace(/https?:\/\//, '').split(':')[0]}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Badge variant="outline" className="bg-slate-50 text-[9px] md:text-[10px] text-slate-600 border-slate-200 py-0 h-5 max-w-[80px] md:max-w-none truncate">
            {connection?.modelId || "AUTO"}
          </Badge>
          <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold text-primary/70 uppercase">
            <ShieldCheck size={12} className="hidden xs:inline" />
            {currentUserRole}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-primary/5 text-primary shrink-0">
            <Layers size={18} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 leading-none truncate">{session.title}</h3>
            <span className="mt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate">{persona.name}</span>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all shrink-0">
              <Settings2 size={14} />
              <span className="hidden xs:inline">Config</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[340px] border-l border-slate-200 bg-white p-0">
            <SheetHeader className="p-6 border-b border-slate-100">
              <SheetTitle className="text-lg font-bold text-slate-900">Engine Parameters</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)]">
              <ParameterControls />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      <ScrollArea className="flex-1 px-2 md:px-4 custom-scrollbar">
        <div className="mx-auto flex w-full max-w-4xl flex-col pb-10">
          {session.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <div className="mb-4 h-12 w-[1px] bg-gradient-to-b from-transparent to-slate-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">System Ready for Input</p>
            </div>
          ) : (
            session.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
          {isTyping && (
            <div className="flex items-center gap-3 px-6 md:px-8 py-6 text-xs text-slate-400 font-medium animate-pulse">
              <Loader2 size={14} className="animate-spin text-primary" />
              Processing engine sequence...
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/40">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 md:h-9 md:w-9 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all"
              >
                <Paperclip size={18} />
              </Button>
            </div>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={currentUserRole === 'Viewer' || isTyping}
              placeholder={currentUserRole === 'Viewer' ? "Read-only access" : `Command ${persona.name}...`}
              className="h-12 md:h-14 w-full rounded-2xl border-slate-200 bg-white pl-12 md:pl-14 pr-12 md:pr-16 text-sm font-medium shadow-sm transition-all focus:border-primary focus:ring-primary/5 focus:shadow-md"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button 
                type="submit" 
                disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={18} />
              </Button>
            </div>
          </form>
          <p className="mt-3 text-center text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
            Enterprise Encryption Active • Local Node Isolation • 0-Latency Bridging
          </p>
        </div>
      </div>
    </div>
  );
}