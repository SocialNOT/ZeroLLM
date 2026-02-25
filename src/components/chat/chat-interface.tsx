
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
  Search,
  Calculator,
  Terminal,
  Database,
  ChevronRight,
  Activity,
  Cloud,
  Laptop,
  Palette,
  Clock,
  LogIn
} from "lucide-react";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
import { personaDrivenChat } from "@/ai/flows/persona-driven-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { ParameterControls } from "./parameter-controls";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { generateChatTitle } from "@/ai/actions/chat-actions";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import Link from "next/link";

export function ChatInterface() {
  const { 
    activeSessionId, 
    sessions, 
    addMessage, 
    updateSession,
    updateMessage,
    personas, 
    frameworks,
    linguisticControls,
    connections,
    activeConnectionId,
    currentUserRole,
    connectionStatus,
    setActiveParameterTab,
    toggleTool,
    sessionStartTime,
    cycleTheme,
    aiMode,
    setAiMode
  } = useAppStore();
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("01:00:00");
  const [mounted, setMounted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const session = sessions.find(s => s.id === activeSessionId);
  const persona = personas.find(p => p.id === session?.personaId) || personas[0];
  const framework = frameworks.find(f => f.id === session?.frameworkId);
  const linguistic = linguisticControls.find(l => l.id === session?.linguisticId);
  const connection = connections.find(c => c.id === activeConnectionId) || connections[0];

  const isGuest = currentUserRole === 'Viewer';
  const showTimer = isGuest && aiMode === 'online';

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (showTimer && sessionStartTime) {
        const ONE_HOUR = 3600000;
        const expiryTime = sessionStartTime + ONE_HOUR;
        const remaining = Math.max(0, expiryTime - now.getTime());
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime, showTimer]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [session?.messages?.length, isTyping, session?.messages[session?.messages.length - 1]?.content]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || !session || isTyping) return;

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

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg = {
      id: assistantMsgId,
      role: "assistant" as const,
      content: "",
      timestamp: Date.now()
    };
    addMessage(session.id, assistantMsg);

    try {
      const combinedSystemPrompt = [
        `You are acting as: ${persona.name}. ${persona.system_prompt}`,
        framework ? `\n\n[STRUCTURAL FRAMEWORK: ${framework.name}]\n${framework.content}` : '',
        linguistic ? `\n\n[LINGUISTIC CONSTRAINTS: ${linguistic.name}]\n${linguistic.system_instruction}` : ''
      ].filter(Boolean).join('\n\n').trim();

      const responseText = await personaDrivenChat({
        baseUrl: aiMode === 'online' ? 'genkit' : (connection?.baseUrl || ''),
        modelId: aiMode === 'online' ? 'gemini-2.5-flash' : (connection?.modelId || ''),
        systemPrompt: combinedSystemPrompt,
        userMessage: textToSend,
        temperature: session.settings.temperature,
        topP: session.settings.topP,
        maxTokens: session.settings.maxTokens,
        history: session.messages.map(m => ({ 
          role: m.role as any, 
          content: m.content,
          timestamp: m.timestamp
        })),
        webSearchEnabled: session.settings.webSearchEnabled,
        reasoningEnabled: session.settings.reasoningEnabled
      });

      updateMessage(session.id, assistantMsgId, { content: responseText });

      if (session.settings.voiceResponseEnabled && responseText) {
        try {
          const { audioUri } = await generateSpeech({ text: responseText });
          const audio = new Audio(audioUri);
          audio.play();
        } catch (vErr) {
          console.warn("Voice auto-play failed", vErr);
        }
      }

    } catch (error: any) {
      let friendlyError = error.message || 'Node connection failure.';
      if (friendlyError.includes('RESOURCE_EXHAUSTED') || friendlyError.includes('429')) {
        friendlyError = "FAILURE: RESOURCE_EXHAUSTED. Gemini node rate limit reached. Please wait for signal reset.";
      }
      updateMessage(session.id, assistantMsgId, {
        content: `FAILURE: ${friendlyError}`
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

  const starters = [
    { title: "Instant Logic", desc: "Explain anything simply in 3 bullet points.", prompt: "Explain the following simply in 3 bullet points: " },
    { title: "Code Guard", desc: "Find bugs and fix security flaws in code.", prompt: "Review this code for bugs and security flaws: " },
    { title: "Draft Master", desc: "Write a high-impact professional response.", prompt: "Draft a professional, clear response to: " },
    { title: "Plan Pilot", desc: "Create a step-by-step roadmap for project.", prompt: "Create a step-by-step project plan for: " }
  ];

  if (!session) return null;

  return (
    <Sheet>
      <div className="flex h-full w-full flex-col overflow-hidden bg-background relative">
        
        {showTimer && (
          <div className="flex-shrink-0 flex items-center justify-center gap-2 py-1 border-b-2 border-border bg-primary/10 z-30">
            <div className="flex items-center justify-center gap-1.5 bg-white px-2 py-0.5 rounded-full border-2 border-primary">
              <span className="text-[7px] font-black uppercase tracking-widest text-primary leading-none">TTL:</span>
              <Clock size={10} className="text-primary" />
              <span className="text-[10px] font-black font-mono text-slate-900 leading-none">{timeLeft}</span>
            </div>
            <Link href="/auth/login">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer shadow-sm">
                <span className="text-[7px] font-black uppercase tracking-widest leading-none">Upgrade</span>
                <LogIn size={10} />
              </div>
            </Link>
          </div>
        )}

        <div className="flex-shrink-0 flex flex-col border-b-2 border-border px-2 py-2 sm:px-6 bg-white z-20 shadow-sm">
          <div className="flex items-center justify-between gap-1 mb-2">
            <SettingsDialog>
              <button className="flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded-lg border-2 border-border shadow-sm active:scale-95 min-w-0">
                <div className={cn(
                  "h-6 w-6 sm:h-7 sm:w-7 rounded-md flex items-center justify-center border-2 shrink-0",
                  connectionStatus === 'online' ? "bg-primary border-primary text-white" : "bg-destructive border-destructive text-white"
                )}>
                  {aiMode === 'online' ? <Cloud className="animate-pulse h-3 w-3" /> : <Activity className="h-3 w-3" />}
                </div>
                <div className="flex flex-col items-start overflow-hidden leading-none">
                  <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-tighter text-primary truncate w-full">
                    {aiMode === 'online' ? "Cloud" : "Local"}
                  </span>
                  <span className="text-[5px] sm:text-[7px] font-black text-slate-900 uppercase tracking-widest truncate w-full">
                    {aiMode === 'online' ? "Gemini" : (connection?.modelId || "Node")}
                  </span>
                </div>
              </button>
            </SettingsDialog>

            {mounted && currentTime && (
              <div className="flex flex-col items-center justify-center leading-none flex-1 min-w-0 px-1">
                <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">
                  {currentTime.toLocaleDateString('en-IN', { weekday: 'long' }).toUpperCase()}
                </span>
                <span className="text-[9px] sm:text-[11px] font-black font-mono tracking-tighter text-slate-900">
                  {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
                <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em] text-primary mt-0.5">
                  {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-0.5 shrink-0">
              <Button variant="outline" size="icon" onClick={() => setAiMode(aiMode === 'online' ? 'offline' : 'online')} className={cn("h-6 w-6 sm:h-7 sm:w-7 rounded-md border-2 border-border", aiMode === 'online' ? "bg-primary text-white border-primary" : "bg-white text-slate-900")}>
                {aiMode === 'online' ? <Cloud size={10} /> : <Laptop size={10} />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => cycleTheme()} className="h-6 w-6 sm:h-7 sm:w-7 rounded-md border-2 border-border text-slate-900 hover:bg-primary hover:text-white">
                <Palette size={10} />
              </Button>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 rounded-md border-2 border-border text-slate-900 hover:bg-primary hover:text-white">
                  <Settings2 size={10} />
                </Button>
              </SheetTrigger>
              <SidebarTrigger className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-border text-slate-900 hover:bg-primary hover:text-white rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-3 border-2 border-border rounded-xl overflow-hidden bg-slate-50 divide-x-2 divide-border shadow-inner">
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('personas')} className="flex flex-col items-center justify-center py-1 hover:bg-primary hover:text-white group transition-colors min-w-0">
                <span className="text-[6px] font-black uppercase tracking-widest text-slate-900 group-hover:text-white">Identity</span>
                <span className="text-[7px] sm:text-[8px] font-black uppercase truncate w-full px-1 text-center text-slate-900 group-hover:text-white">{persona.name}</span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('frameworks')} className="flex flex-col items-center justify-center py-1 hover:bg-primary hover:text-white group transition-colors min-w-0">
                <span className="text-[6px] font-black uppercase tracking-widest text-slate-900 group-hover:text-white">Arch</span>
                <span className="text-[7px] sm:text-[8px] font-black uppercase truncate w-full px-1 text-center text-slate-900 group-hover:text-white">{framework?.name || "None"}</span>
              </button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <button onClick={() => setActiveParameterTab('linguistic')} className="flex flex-col items-center justify-center py-1 hover:bg-primary hover:text-white group transition-colors min-w-0">
                <span className="text-[6px] font-black uppercase tracking-widest text-slate-900 group-hover:text-white">Logic</span>
                <span className="text-[7px] sm:text-[8px] font-black uppercase truncate w-full px-1 text-center text-slate-900 group-hover:text-white">{linguistic?.name || "Default"}</span>
              </button>
            </SheetTrigger>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
          <div className="mx-auto flex w-full max-w-5xl flex-col py-4 px-4 sm:px-8 h-full">
            {session.messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-4 sm:py-8 text-center space-y-4 sm:space-y-6 animate-in fade-in zoom-in duration-700 max-w-2xl mx-auto w-full overflow-hidden">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase px-4">Neural Node Synchronized</h2>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-primary mt-1">Establish command sequence to begin orchestration</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-lg px-2">
                  {starters.map((starter, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setInput(starter.prompt)} 
                      className={cn(
                        "group flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white border-2 border-border shadow-md hover:shadow-xl hover:border-primary transition-all text-left relative overflow-hidden animate-in slide-in-from-left duration-500",
                        idx === 0 ? "delay-[100ms]" : idx === 1 ? "delay-[200ms]" : idx === 2 ? "delay-[300ms]" : "delay-[400ms]"
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-primary group-hover:text-white transition-all border border-border shrink-0">
                        <Zap size={12} />
                      </div>
                      <div className="flex flex-col min-w-0 overflow-hidden">
                        <span className="text-[9px] sm:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1 truncate">{starter.title}</span>
                        <p className="text-[7px] sm:text-[9px] font-bold text-slate-900 truncate leading-none">{starter.desc}</p>
                      </div>
                      <div className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {session.messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined} />
                ))}
              </div>
            )}
            {isTyping && !session.messages[session.messages.length - 1]?.content && (
              <div className="flex items-center gap-3 px-6 py-6 text-[11px] text-primary font-black uppercase tracking-[0.3em] animate-pulse">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                </div>
                Orchestrating Logic...
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-2 sm:p-6 bg-white border-t-2 border-border z-30">
          <div className="mx-auto max-w-4xl border-2 border-border rounded-2xl overflow-hidden shadow-2xl bg-white focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <div className="grid grid-cols-6 divide-x-2 divide-border border-b-2 border-border bg-slate-50">
              {[
                { id: 'webSearch', icon: <Search size={10} />, title: 'Ground' },
                { id: 'reasoning', icon: <Brain size={10} />, title: 'Think' },
                { id: 'voice', icon: <Mic size={10} />, title: 'Voice' },
                { id: 'calculator', icon: <Calculator size={10} />, title: 'Math' },
                { id: 'code', icon: <Terminal size={10} />, title: 'Code' },
                { id: 'knowledge', icon: <Database size={10} />, title: 'Vault' }
              ].map(tool => {
                const settingKey = tool.id === 'webSearch' ? 'webSearchEnabled' : 
                                 tool.id === 'reasoning' ? 'reasoningEnabled' : 
                                 tool.id === 'voice' ? 'voiceResponseEnabled' : 
                                 tool.id + 'Enabled';
                const isActive = (session.settings as any)[settingKey];
                return (
                  <button 
                    key={tool.id} 
                    onClick={() => toggleTool(session.id, tool.id as any)} 
                    className={cn(
                      "flex flex-col items-center justify-center py-1.5 sm:py-2 transition-all active:scale-95 min-w-0",
                      isActive 
                        ? "bg-primary text-white" 
                        : "bg-transparent text-slate-900 hover:bg-primary/10"
                    )}
                  >
                    <div className="mb-0.5">{tool.icon}</div>
                    <span className="text-[5px] sm:text-[7px] font-black uppercase tracking-tighter leading-none truncate w-full px-0.5 text-center">{tool.title}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center bg-white p-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
                placeholder="INPUT COMMAND..."
                className="h-9 sm:h-10 w-full border-none bg-transparent px-2 sm:px-4 text-[13px] sm:text-[15px] font-black text-slate-900 focus-visible:ring-0 placeholder:text-slate-900 placeholder:uppercase placeholder:text-[8px] sm:placeholder:text-[9px] placeholder:tracking-widest"
              />
              <Button type="submit" disabled={!input.trim() || isTyping} className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all shrink-0">
                <Send size={16} className="sm:size-[18px]" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      <SheetContent side="right" className="p-0 border-l-2 border-border w-full sm:max-w-md">
        <ParameterControls />
      </SheetContent>
    </Sheet>
  );
}
