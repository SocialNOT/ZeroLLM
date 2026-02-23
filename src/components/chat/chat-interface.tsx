"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { ChatMessage } from "./chat-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Paperclip, Loader2, ArrowDown, Wifi, ShieldCheck, Wrench } from "lucide-react";
import { personaDrivenChat } from "@/ai/flows/persona-driven-chat";
import { documentAwareAIChat } from "@/ai/flows/document-aware-ai-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParameterControls } from "./parameter-controls";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ChatInterface() {
  const { 
    activeSessionId, 
    sessions, 
    addMessage, 
    personas, 
    connections,
    activeConnectionId,
    workspaces,
    activeWorkspaceId,
    currentUserRole 
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const session = sessions.find(s => s.id === activeSessionId);
  const workspace = workspaces.find(w => w.id === activeWorkspaceId);
  const persona = personas.find(p => p.id === session?.personaId) || personas[0];
  const connection = connections.find(c => c.id === activeConnectionId) || connections[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session || isTyping) return;
    if (currentUserRole === 'Viewer') return;

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
      let responseContent = "";
      let citations = undefined;

      if (workspace?.knowledgeBaseId) {
        const ragResponse = await documentAwareAIChat({
          query: input,
          knowledgeBaseId: workspace.knowledgeBaseId
        });
        responseContent = ragResponse.answer;
        citations = ragResponse.citations;
      } else {
        responseContent = await personaDrivenChat({
          systemPrompt: persona.systemPrompt,
          userMessage: input,
          temperature: session.settings.temperature,
          topP: session.settings.topP,
          maxTokens: session.settings.maxTokens,
          memoryType: session.settings.memoryType,
          enabledTools: session.settings.enabledTools || [],
          history: session.messages
        });
      }

      addMessage(session.id, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: Date.now(),
        citations
      });
    } catch (error) {
      console.error("AI Error:", error);
      addMessage(session.id, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I encountered an error connecting to the model backend. Please check your connection settings.",
        timestamp: Date.now()
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-background">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20">
          <Sparkles className="text-accent animate-pulse" size={40} />
        </div>
        <h2 className="mb-2 font-headline text-2xl font-bold">Select or start a conversation</h2>
        <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
          Choose a workspace from the sidebar and start interacting with Aetheria's high-performance LLM engine.
        </p>
      </div>
    );
  }

  const enabledToolsCount = session.settings?.enabledTools?.length ?? 0;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-2 w-2 rounded-full",
              connection ? "bg-accent shadow-[0_0_8px_rgba(0,255,255,0.6)]" : "bg-red-500"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {connection ? "Engine Active" : "Engine Offline"}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-[10px] text-accent font-code">
            <Wifi size={10} />
            {connection?.baseUrl.replace(/https?:\/\//, '')}
          </div>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-primary" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{currentUserRole} Access</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {enabledToolsCount > 0 && (
            <div className="flex items-center gap-1">
              <Wrench size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">{enabledToolsCount} Tools Loaded</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
            <span>{connection?.modelId}</span>
            <span className="text-white/10 px-1">|</span>
            <Badge variant="outline" className="border-accent/30 text-accent py-0 h-4 text-[8px] uppercase">{session.settings.memoryType} Memory</Badge>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold leading-none">{session.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <span>{persona.name}</span>
            </div>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-accent">
              <ArrowDown size={14} className="rotate-180" />
              Parameters
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[320px] sm:w-[400px] bg-background/95 backdrop-blur-lg border-l border-white/5">
            <SheetHeader className="mb-6">
              <SheetTitle className="font-headline text-lg uppercase tracking-widest text-accent">Engine Config</SheetTitle>
            </SheetHeader>
            <ParameterControls />
          </SheetContent>
        </Sheet>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mx-auto flex w-full max-w-4xl flex-col">
          {session.messages.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center opacity-50">
              <div className="mb-4 h-[1px] w-20 bg-accent/20" />
              <p className="font-headline text-xs uppercase tracking-[0.3em]">Awaiting Input Sequence</p>
            </div>
          ) : (
            session.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
          {isTyping && (
            <div className="flex items-center gap-2 px-8 py-4 text-xs text-muted-foreground font-medium italic">
              <Loader2 size={12} className="animate-spin text-accent" />
              Generating response...
            </div>
          )}
          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-white/5 bg-white/[0.01] p-6">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                disabled={currentUserRole === 'Viewer'}
                className="h-8 w-8 text-muted-foreground hover:text-accent"
              >
                <Paperclip size={18} />
              </Button>
            </div>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={currentUserRole === 'Viewer'}
              placeholder={currentUserRole === 'Viewer' ? "Read-only access" : `Message ${persona.name}...`}
              className="h-14 w-full rounded-2xl border-white/10 bg-white/5 pl-14 pr-24 text-sm font-medium transition-all focus:border-accent/40 focus:ring-accent/10"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button 
                type="submit" 
                disabled={!input.trim() || isTyping || currentUserRole === 'Viewer'}
                className="h-10 w-10 rounded-xl bg-primary text-accent shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                <Send size={18} />
              </Button>
            </div>
          </form>
          <div className="mt-3 flex items-center justify-center gap-6 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Enterprise Encrypted</span>
            <span className="text-white/10">•</span>
            <span>Self-Hosted LLM</span>
            <span className="text-white/10">•</span>
            <span>Zero Data Leakage</span>
          </div>
        </div>
      </div>
    </div>
  );
}