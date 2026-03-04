"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Calculator,
  Terminal,
  Database,
  ChevronUp,
  ChevronDown,
  Activity,
  Cloud,
  Laptop,
  Palette,
  Clock,
  LogIn,
  Eye,
  Loader2,
  LineChart,
  Milestone,
  Microscope,
  Sparkles,
  UserCircle,
  Layers,
  Type,
  ArrowLeft,
  Check,
  Target
} from "lucide-react";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { generateChatTitle } from "@/ai/actions/chat-actions";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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
    activeOnlineModelId,
    currentUserRole,
    connectionStatus,
    toggleTool,
    sessionStartTime,
    cycleTheme,
    aiMode,
    setAiMode,
    setIsSettingsOpen,
    applyPersona,
    applyFramework,
    applyLinguisticControl
  } = useAppStore();
  
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("01:00:00");
  const [latency, setLatency] = useState("---");
  const [mounted, setMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // OTG State
  const [activeTab, setActiveTab] = useState("caps");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const session = sessions.find(s => s.id === activeSessionId);
  const persona = personas.find(p => p.id === session?.personaId) || personas[0];
  const framework = frameworks.find(f => f.id === session?.frameworkId);
  const linguistic = linguisticControls.find(l => l.id === session?.linguisticId);
  const connection = connections.find(c => c.id === activeConnectionId) || connections[0];

  const isGuest = currentUserRole === 'Viewer';
  const showTimer = isGuest && aiMode === 'online';

  const activeModelId = aiMode === 'online' ? activeOnlineModelId : (connection?.modelId || "Node");

  // Groups for Categories
  const groupedFrameworks = useMemo(() => {
    return frameworks.reduce((acc, f) => {
      if (!acc[f.category]) acc[f.category] = [];
      acc[f.category].push(f);
      return acc;
    }, {} as Record<string, typeof frameworks>);
  }, [frameworks]);

  const groupedPersonas = useMemo(() => {
    return personas.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, typeof personas>);
  }, [personas]);

  const groupedLinguistics = useMemo(() => {
    return linguisticControls.reduce((acc, l) => {
      if (!acc[l.category]) acc[l.category] = [];
      acc[l.category].push(l);
      return acc;
    }, {} as Record<string, typeof linguisticControls>);
  }, [linguisticControls]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-IN';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          setInput(transcript);
          
          if (event.results[0].isFinal) {
            setIsListening(false);
            setTimeout(() => {
              if (transcript.trim().length > 2) {
                handleSend(transcript);
              }
            }, 500);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast({ 
              variant: "destructive", 
              title: "Speech Node Error", 
              description: "Signal integrity compromised.",
              className: "rounded-none border-2 border-destructive bg-white text-destructive font-bold uppercase text-[10px]"
            });
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [toast]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast({ 
        variant: "destructive", 
        title: "Hardware Error", 
        description: "Speech engine not detected.",
        className: "rounded-none border-2 border-destructive bg-white text-destructive font-bold uppercase text-[10px]"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Mic Failure", e);
      }
    }
  }, [isListening, toast]);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (showTimer && sessionStartTime) {
        const remaining = Math.max(0, (sessionStartTime + 3600000) - now.getTime());
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime, showTimer]);

  useEffect(() => {
    if (connectionStatus === 'online') {
      setLatency(`${Math.floor(Math.random() * 30 + 12)}ms`);
    } else {
      setLatency("---");
    }
  }, [connectionStatus, activeSessionId, activeModelId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [session?.messages?.length, isTyping]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || !session || isTyping) return;

    if (session.messages.length === 0) {
      generateChatTitle(textToSend).then(title => updateSession(session.id, { title }));
    }

    addMessage(session.id, {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: Date.now()
    });
    
    setInput("");
    setIsTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    addMessage(session.id, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now()
    });

    try {
      const combinedSystemPrompt = [
        `You are acting as: ${persona.name}. ${persona.system_prompt}`,
        framework ? `\n\n[ARCH: ${framework.name}]\n${framework.content}` : '',
        linguistic ? `\n\n[LOGIC: ${linguistic.name}]\n${linguistic.system_instruction}` : ''
      ].filter(Boolean).join('\n\n');

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: aiMode === 'online' ? 'genkit' : (connection?.baseUrl || ''),
          modelId: aiMode === 'online' ? activeOnlineModelId : (connection?.modelId || ''),
          messages: [
            { role: 'system', content: combinedSystemPrompt },
            ...session.messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: textToSend }
          ],
          settings: session.settings,
          apiKey: connection?.apiKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Node Error');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream Failure");

      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') break;
          try {
            const data = JSON.parse(dataStr);
            const text = data.choices?.[0]?.delta?.content || "";
            if (text) {
              streamedContent += text;
              updateMessage(session.id, assistantMsgId, { content: streamedContent });
            }
          } catch (e) {}
        }
      }

      if (session.settings.voiceResponseEnabled && streamedContent) {
        const { audioUri } = await generateSpeech({ text: streamedContent });
        const audio = new Audio(audioUri);
        audio.play();
      }

    } catch (error: any) {
      updateMessage(session.id, assistantMsgId, {
        content: `FAILURE: ${error.message || 'Node link lost.'}`
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (command: string) => {
    handleSend(command);
  };

  if (!session) return null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background relative">
      
      {/* TELEMETRY HUD */}
      <div className="flex-shrink-0 z-40 flex flex-col">
        <div className="h-6 bg-primary border-b-2 border-border overflow-hidden relative flex items-center">
          <div className="whitespace-nowrap animate-marquee flex">
            <span className="logo-shimmer text-[9px] font-black uppercase tracking-[0.3em] py-1 inline-block brightness-[200%]">
              {` • [NEURAL SYNC: ${currentTime?.toLocaleTimeString()}] • [COMMAND HUB ACTIVE] • [NODE SECURED] • `.repeat(10)}
            </span>
          </div>
        </div>

        {showTimer && (
          <div className="flex items-center justify-center gap-2 py-1 border-b-2 border-border bg-primary/10">
            <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 border-2 border-primary">
              <span className="text-[7px] font-black uppercase tracking-widest text-primary">TTL:</span>
              <Clock size={10} className="text-primary" />
              <span className="text-[10px] font-black font-mono text-slate-900">{timeLeft}</span>
            </div>
            <Link href="/auth/login" className="flex items-center gap-1 px-2 py-0.5 bg-primary text-white hover:bg-primary/90">
              <span className="text-[7px] font-black uppercase tracking-widest">Upgrade</span>
              <LogIn size={10} />
            </Link>
          </div>
        )}

        <div className="flex flex-col border-b-2 border-border px-4 py-2 sm:px-6 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 bg-slate-50 px-2 py-1 border-2 border-border active:scale-95 transition-all"
              >
                <div className={cn(
                  "h-6 w-6 flex items-center justify-center border-2",
                  connectionStatus === 'online' ? "bg-primary border-primary text-white" : "bg-destructive border-destructive text-white"
                )}>
                  {aiMode === 'online' ? <Cloud className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                </div>
                <div className="flex flex-col items-start leading-none pr-2 min-w-0">
                  <span className="text-[7px] font-black uppercase text-primary">
                    {aiMode === 'online' ? "Cloud" : "Local"}
                  </span>
                  <span className="text-[8px] font-black text-slate-900 uppercase truncate max-w-[100px]">
                    {activeModelId.split('/').pop()}
                  </span>
                </div>
              </button>
            </div>

            <div className="hidden sm:flex flex-col items-start justify-center leading-none flex-1 px-4">
              <div className="flex items-center gap-1.5 mb-1">
                <div className={cn("h-1.5 w-1.5", connectionStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                <span className={cn("text-[8px] font-black uppercase tracking-widest", connectionStatus === 'online' ? "text-emerald-600" : "text-rose-600")}>
                  SYNC
                </span>
                <span className="text-[8px] font-black text-primary font-mono opacity-80 border-l border-primary/20 pl-1.5">
                  {latency}
                </span>
              </div>
              <span className="text-[9px] font-black text-slate-900 uppercase tracking-tighter truncate max-w-[300px]">
                {activeModelId.replace('googleai/', '')}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setAiMode(aiMode === 'online' ? 'offline' : 'online')} className={cn("h-8 w-8 rounded-none border-2 border-border transition-all", aiMode === 'online' ? "bg-primary text-white border-primary" : "bg-white")}>
                {aiMode === 'online' ? <Cloud size={12} /> : <Laptop size={12} />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => cycleTheme()} className="h-8 w-8 rounded-none border-2 border-border">
                <Palette size={12} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} className="h-8 w-8 rounded-none border-2 border-border">
                <Settings2 size={12} />
              </Button>
              <SidebarTrigger className="h-8 w-8 border-2 border-border rounded-none" />
            </div>
          </div>
        </div>
      </div>

      {/* VAULTED LOGIC CANVAS */}
      <div className="flex-1 min-h-0 overflow-hidden relative p-2 sm:p-4 bg-slate-50/5">
        <div className="sleek-animated-border-container h-full w-full">
          <div className="app-surface h-full w-full flex flex-col overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="flex-1 custom-scrollbar">
              <div className="mx-auto flex w-full max-w-5xl flex-col py-6 px-4 sm:px-12">
                {session.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-3">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Neural Node Synchronized</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Establish command sequence to begin orchestration</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {session.messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} onAction={handleAction} />
                    ))}
                  </div>
                )}
                {isTyping && !session.messages[session.messages.length - 1]?.content && (
                  <div className="flex items-center gap-3 px-6 py-6 text-[11px] text-primary font-black uppercase tracking-[0.3em] animate-pulse">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 bg-primary animate-bounce" />
                    </div>
                    Orchestrating Logic...
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* COMMAND CONSOLE */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-white border-t-2 border-border z-30">
        <div className="mx-auto max-w-4xl border-2 border-border rounded-none overflow-hidden shadow-2xl bg-white focus-within:ring-4 focus-within:ring-primary/5 transition-all">
          
          <button 
            type="button"
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            className="w-full h-5 bg-slate-50 border-b-2 border-border hover:bg-slate-100 transition-colors flex items-center justify-center group"
          >
            {isToolsExpanded ? <ChevronDown size={14} className="text-primary" /> : <ChevronUp size={14} className="text-slate-400 group-hover:text-primary" />}
          </button>

          {isToolsExpanded && (
            <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedCategory(null); }} className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
              <TabsList className="grid w-full grid-cols-4 bg-slate-50 h-10 p-0 rounded-none border-b-2 border-border relative overflow-hidden">
                {[
                  { id: 'caps', label: 'Caps', icon: <Zap size={12} /> },
                  { id: 'id', label: 'ID', icon: <UserCircle size={12} /> },
                  { id: 'arch', label: 'Arch', icon: <Layers size={12} /> },
                  { id: 'logic', label: 'Logic', icon: <Type size={12} /> }
                ].map((tab, idx) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest h-full rounded-none gap-2 data-[state=active]:bg-white data-[state=active]:text-primary transition-all group relative",
                      activeTab === tab.id && "animate-pulse-glow"
                    )}
                  >
                    <span className="group-hover:scale-110 transition-transform flex items-center gap-2">
                      {tab.icon}
                      {tab.label}
                    </span>
                    {idx < 3 && <div className="absolute right-0 top-1/4 bottom-1/4 w-[1px] bg-border/20 animate-pulse" />}
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="max-h-[300px] bg-white">
                <div className="p-4">
                  {/* CAPS TAB - Original Tool Grid */}
                  <TabsContent value="caps" className="mt-0">
                    <div className="grid grid-cols-6 divide-x-2 divide-border border-2 border-border bg-slate-50">
                      {[
                        { id: 'webSearch', icon: <Search size={10} />, title: 'Ground' },
                        { id: 'reasoning', icon: <Brain size={10} />, title: 'Think' },
                        { id: 'vision', icon: <Eye size={10} />, title: 'Vision' },
                        { id: 'research', icon: <Microscope size={10} />, title: 'Research' },
                        { id: 'voice', icon: <Mic size={10} />, title: 'Voice' },
                        { id: 'calculator', icon: <Calculator size={10} />, title: 'Math' },
                        { id: 'code', icon: <Terminal size={10} />, title: 'Code' },
                        { id: 'analysis', icon: <LineChart size={10} />, title: 'Logic' },
                        { id: 'planning', icon: <Milestone size={10} />, title: 'Strategy' },
                        { id: 'knowledge', icon: <Database size={10} />, title: 'Vault' },
                        { id: 'summary', icon: <Activity size={10} />, title: 'Abstract' },
                        { id: 'creative', icon: <Sparkles size={10} />, title: 'Novelty' }
                      ].map((tool, idx) => {
                        const isActive = (session.settings as any)[tool.id === 'webSearch' ? 'webSearchEnabled' : tool.id === 'reasoning' ? 'reasoningEnabled' : tool.id + 'Enabled'];
                        return (
                          <button 
                            key={tool.id} 
                            onClick={() => toggleTool(session.id, tool.id as any)} 
                            className={cn(
                              "flex flex-col items-center justify-center py-2.5 transition-all min-w-0",
                              idx < 6 && "border-b-2 border-border",
                              isActive ? "bg-accent text-white" : "text-slate-900 hover:bg-primary/5"
                            )}
                          >
                            <div className="mb-0.5">{tool.icon}</div>
                            <span className="text-[7px] font-black uppercase tracking-tighter truncate w-full px-1 text-center">{tool.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* ID TAB - Personas */}
                  <TabsContent value="id" className="mt-0">
                    {!selectedCategory ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.keys(groupedPersonas).map((cat) => (
                          <Button 
                            key={cat} 
                            variant="outline" 
                            onClick={() => setSelectedCategory(cat)}
                            className="h-16 rounded-none border-2 border-border flex flex-col items-center justify-center gap-1 group hover:border-accent transition-all"
                          >
                            <UserCircle size={14} className="text-accent" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{cat}</span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-[8px] font-bold uppercase gap-2 mb-2">
                          <ArrowLeft size={10} /> Back to Identities
                        </Button>
                        <div className="grid grid-cols-1 gap-2">
                          {groupedPersonas[selectedCategory].map((p) => (
                            <button 
                              key={p.id}
                              onClick={() => applyPersona(session.id, p.id)}
                              className={cn(
                                "p-3 text-left border-2 transition-all flex justify-between items-center",
                                session.personaId === p.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/20"
                              )}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-tight text-slate-900">{p.name}</div>
                                <p className="text-[8px] text-slate-500 line-clamp-1">{p.description}</p>
                              </div>
                              {session.personaId === p.id && <Check size={12} className="text-accent shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ARCH TAB - Frameworks */}
                  <TabsContent value="arch" className="mt-0">
                    {!selectedCategory ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.keys(groupedFrameworks).map((cat) => (
                          <Button 
                            key={cat} 
                            variant="outline" 
                            onClick={() => setSelectedCategory(cat)}
                            className="h-16 rounded-none border-2 border-border flex flex-col items-center justify-center gap-1 group hover:border-accent transition-all"
                          >
                            <Layers size={14} className="text-accent" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{cat}</span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-[8px] font-bold uppercase gap-2 mb-2">
                          <ArrowLeft size={10} /> Back to Architectures
                        </Button>
                        <div className="grid grid-cols-1 gap-2">
                          {groupedFrameworks[selectedCategory].map((f) => (
                            <button 
                              key={f.id}
                              onClick={() => applyFramework(session.id, f.id)}
                              className={cn(
                                "p-3 text-left border-2 transition-all flex justify-between items-center",
                                session.frameworkId === f.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/20"
                              )}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-tight text-slate-900">{f.name}</div>
                                <p className="text-[8px] text-slate-500 line-clamp-1">{f.description}</p>
                              </div>
                              {session.frameworkId === f.id && <Check size={12} className="text-accent shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* LOGIC TAB - Linguistics */}
                  <TabsContent value="logic" className="mt-0">
                    {!selectedCategory ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.keys(groupedLinguistics).map((cat) => (
                          <Button 
                            key={cat} 
                            variant="outline" 
                            onClick={() => setSelectedCategory(cat)}
                            className="h-16 rounded-none border-2 border-border flex flex-col items-center justify-center gap-1 group hover:border-accent transition-all"
                          >
                            <Type size={14} className="text-accent" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{cat}</span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-[8px] font-bold uppercase gap-2 mb-2">
                          <ArrowLeft size={10} /> Back to Logic
                        </Button>
                        <div className="grid grid-cols-1 gap-2">
                          {groupedLinguistics[selectedCategory].map((l) => (
                            <button 
                              key={l.id}
                              onClick={() => applyLinguisticControl(session.id, l.id)}
                              className={cn(
                                "p-3 text-left border-2 transition-all flex justify-between items-center",
                                session.linguisticId === l.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/20"
                              )}
                            >
                              <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-tight text-slate-900">{l.name}</div>
                                <p className="text-[8px] text-slate-500 line-clamp-1">{l.description}</p>
                              </div>
                              {session.linguisticId === l.id && <Check size={12} className="text-accent shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center bg-white p-1 border-t-2 border-border">
            <button 
              type="button" 
              onClick={toggleListening}
              className={cn(
                "h-10 w-10 flex items-center justify-center transition-all shrink-0",
                isListening ? "bg-rose-600 text-white animate-pulse" : "bg-slate-100 text-slate-900"
              )}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder={isListening ? "LISTENING FOR SIGNAL..." : "INPUT COMMAND..."}
              className="h-10 border-none bg-transparent px-4 text-[15px] font-black text-slate-900 focus-visible:ring-0 placeholder:text-slate-400 placeholder:text-[9px] placeholder:tracking-widest rounded-none"
            />

            <Button type="submit" disabled={!input.trim() || isTyping} className="h-10 w-10 rounded-none bg-accent text-white shadow-xl shadow-accent/20 shrink-0 transition-all active:scale-95">
              {isTyping ? <Loader2 className="animate-spin size-4" /> : <Send size={18} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}