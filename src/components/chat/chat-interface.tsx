
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
  X
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
    
    // Find the last user message
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
          
          <Popover>
            <PopoverTrigger asChild>
              <div 
                className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-slate-400 cursor-pointer hover:text-primary transition-colors"
                onClick={() => setTempUrl(connection?.baseUrl || "")}
              >
                <Wifi size={10} />
                <span className="truncate max-w-[120px] md:max-w-none">
                  {connection?.baseUrl.replace(/https?:\/\//, '').split('/')[0]}
                </span>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4 rounded-2xl shadow-2xl border-white/20 bg-white/95 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Node</div>
                  <Badge variant="outline" className="text-[8px] h-4">HTTP / HTTPS</Badge>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={tempUrl} 
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="h-9 rounded-xl border-slate-200 bg-white font-mono text-xs focus:ring-primary/20"
                  />
                  <Button 
                    size="sm" 
                    className="h-9 rounded-xl bg-primary px-3 text-[10px] font-bold uppercase" 
                    onClick={handleUpdateUrl}
                  >
                    Sync
                  </Button>
                </div>
                <p className="text-[9px] text-slate-400 italic">Changing this will re-validate the engine connection.</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge 
                variant="outline" 
                className="cursor-pointer bg-slate-50 hover:bg-white text-[9px] md:text-[10px] text-slate-600 border-slate-200 py-0 h-6 max-w-[100px] md:max-w-none truncate transition-all flex items-center gap-1.5 pr-2"
              >
                <div className="max-w-[80px] truncate">{connection?.modelId || "AUTO"}</div>
                <ChevronDown size={10} className="text-slate-400" />
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px] rounded-2xl p-2 bg-white/95 backdrop-blur-xl border-slate-100 shadow-xl">
              <div className="px-2 py-1.5 mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                Active Engine Node
              </div>
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <DropdownMenuItem 
                    key={model} 
                    onClick={() => updateConnection(connection.id, { modelId: model })}
                    className={cn(
                      "text-xs font-semibold rounded-xl cursor-pointer py-2 transition-colors",
                      model === connection.modelId ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {model === connection.modelId && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(75,0,130,0.4)]" />}
                      <span className="truncate">{model}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-medium italic">No discovered models</p>
                  <Button variant="ghost" size="sm" className="mt-2 h-7 text-[9px] font-bold uppercase" onClick={() => checkConnection()}>
                    Refresh Node
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined} 
              />
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
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative group">
            {attachedFile && (
              <div className="absolute -top-10 left-0 flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] font-bold text-primary truncate max-w-[150px]">{attachedFile.name}</span>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-rose-500">
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2">
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
