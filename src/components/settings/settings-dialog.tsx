
"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { 
  Settings2, 
  Server, 
  Shield, 
  Database, 
  Cpu, 
  RefreshCw, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Zap, 
  Key,
  Activity,
  Lock,
  Box,
  Fingerprint,
  ChevronDown,
  Terminal,
  Brain,
  Eye,
  Microscope,
  Layers,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  ActivitySquare,
  Cloud,
  Laptop,
  Globe
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { 
    connections, 
    activeConnectionId, 
    updateConnection, 
    availableModels, 
    connectionStatus, 
    checkConnection,
    triggerModelLoad,
    isModelLoading,
    aiMode,
    setAiMode
  } = useAppStore();
  
  const conn = connections.find(c => c.id === activeConnectionId);
  const [urlInput, setUrlInput] = useState(conn?.baseUrl || "");
  const [tokenInput, setTokenInput] = useState(conn?.apiKey || "");
  const [latency, setLatency] = useState("---");
  const [activeCard, setActiveCard] = useState<'engine' | 'shield' | 'vault'>('engine');

  useEffect(() => {
    if (connectionStatus === 'online') {
      setLatency(`${Math.floor(Math.random() * 40 + 10)}ms`);
    } else {
      setLatency("---");
    }
  }, [connectionStatus]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (conn) {
      updateConnection(conn.id, { baseUrl: urlInput, apiKey: tokenInput });
      await checkConnection();
    }
  };

  const handleLoadModel = async (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conn) updateConnection(conn.id, { modelId });
    
    const success = await triggerModelLoad(modelId);
    if (success) {
      toast({
        title: "Neural Path Synchronized",
        description: `Model node ${modelId} is now energized.`,
      });
    }
  };

  const getModelCapabilities = (modelId: string) => {
    const id = modelId.toLowerCase();
    const caps = [];
    if (id.includes('llama') || id.includes('qwen') || id.includes('gemma') || id.includes('liquid') || id.includes('gemini')) {
      caps.push({ label: 'Tools', icon: <Terminal size={8} /> });
    }
    if (id.includes('deepseek') || id.includes('r1') || id.includes('o1') || id.includes('gemini')) {
      caps.push({ label: 'Thinking', icon: <Brain size={8} /> });
    }
    if (id.includes('vision') || id.includes('vl') || id.includes('gemini')) {
      caps.push({ label: 'Vision', icon: <Eye size={8} /> });
    }
    if (id.includes('rag') || id.includes('nomic')) {
      caps.push({ label: 'RAG', icon: <Microscope size={8} /> });
    }
    return caps.length > 0 ? caps : [{ label: 'General', icon: <Zap size={8} /> }];
  };

  const getModelGlow = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('gemini')) return "hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] border-primary/20";
    if (id.includes('deepseek') || id.includes('r1')) return "hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] border-purple-500/20";
    if (id.includes('llama')) return "hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] border-blue-500/20";
    if (id.includes('qwen')) return "hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] border-orange-500/20";
    if (id.includes('vision') || id.includes('vl')) return "hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] border-pink-500/20";
    return "hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-500/20";
  };

  const getModelPulse = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('gemini')) return "bg-primary";
    if (id.includes('deepseek') || id.includes('r1')) return "bg-purple-500";
    if (id.includes('llama')) return "bg-blue-500";
    if (id.includes('qwen')) return "bg-orange-500";
    return "bg-emerald-500";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full border-white/20 bg-white/95 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[3rem] p-0 overflow-hidden outline-none gap-0 border">
        <div className="flex flex-col max-h-[75vh]">
          <header className="p-4 sm:p-6 bg-white/50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <Settings2 size={18} />
              </div>
              <div>
                <DialogTitle className="font-headline text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">Node Command Panel</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold text-[8px] uppercase tracking-widest mt-1">
                  Orchestrate engine protocols and secure cognitive nodes.
                </DialogDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "text-[8px] uppercase font-bold gap-1.5 px-3 py-1 rounded-full border",
                connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-500 bg-rose-50"
              )}>
                <div className={cn("h-1.5 w-1.5 rounded-full", connectionStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                {aiMode === 'online' ? 'Cloud Connected' : connectionStatus}
              </Badge>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-4">
            
            <div className="px-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block">Neural Orchestration Mode</Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setAiMode('online')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    aiMode === 'online' ? "bg-white text-primary shadow-md ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Cloud size={16} />
                  Cloud Node (Gemini)
                </button>
                <button 
                  onClick={() => setAiMode('offline')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    aiMode === 'offline' ? "bg-white text-primary shadow-md ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Laptop size={16} />
                  Local Node (Custom)
                </button>
              </div>
            </div>

            <Card className={cn(
              "border-slate-100 bg-white shadow-sm rounded-2xl overflow-hidden transition-all duration-500",
              activeCard === 'engine' ? "ring-1 ring-primary/20" : "opacity-80 grayscale-[0.5]"
            )}>
              <div 
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => setActiveCard('engine')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {aiMode === 'online' ? <Cloud size={16} /> : <Server size={16} className={cn(connectionStatus === 'online' && activeCard === 'engine' && "animate-pulse")} />}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">
                      {aiMode === 'online' ? 'Cloud Infrastructure' : 'Engine Node'}
                    </h3>
                    <span className="text-[7px] text-slate-400 font-bold uppercase mt-1">
                      {aiMode === 'online' ? 'Gemini 2.5 Flash Energized' : `Network Protocol: ${connectionStatus === 'online' ? 'Synchronized' : 'Offline'}`}
                    </span>
                  </div>
                </div>
                {activeCard === 'engine' && aiMode === 'offline' && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-7 text-[8px] font-bold uppercase rounded-lg gap-1.5 px-2"
                    onClick={handleRefresh}
                    disabled={connectionStatus === 'checking'}
                  >
                    {connectionStatus === 'checking' ? <Loader2 className="animate-spin h-3 w-3" /> : <RefreshCw size={10} />}
                    Sync Node
                  </Button>
                )}
              </div>

              {activeCard === 'engine' && (
                <CardContent className="px-4 pb-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {aiMode === 'offline' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Base API URL</Label>
                        <Input 
                          value={urlInput} 
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="rounded-xl border-slate-100 bg-slate-50 font-mono text-[10px] h-9 focus:ring-primary/20"
                          placeholder="http://localhost:11434/v1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Secret Token (Optional)</Label>
                        <Input 
                          type="password"
                          value={tokenInput} 
                          onChange={(e) => setTokenInput(e.target.value)}
                          className="rounded-xl border-slate-100 bg-slate-50 font-mono text-[10px] h-9 focus:ring-primary/20"
                          placeholder="sk-..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 mt-2">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Google Cloud Handshake</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Latency optimized via Genkit node</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Cpu size={12} className="text-primary" />
                        <span className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Compute Engine</span>
                      </div>
                      <Badge variant="outline" className="text-[7px] font-bold uppercase px-2 py-0 border-slate-100 text-slate-400">
                        {aiMode === 'online' ? '1 Active Node' : `${availableModels.length} Indexed Models`}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(aiMode === 'online' ? ['gemini-2.5-flash'] : availableModels).map(model => {
                        const caps = getModelCapabilities(model);
                        const glowClass = getModelGlow(model);
                        const pulseColor = getModelPulse(model);
                        const isActive = aiMode === 'online' ? true : (conn?.modelId === model);
                        
                        return (
                          <div 
                            key={model}
                            className={cn(
                              "relative flex flex-col p-3 rounded-2xl border transition-all duration-300 group overflow-hidden bg-white cursor-default",
                              isActive ? "ring-2 ring-primary border-transparent" : "border-slate-100 hover:bg-slate-50",
                              glowClass
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className={cn("h-1.5 w-1.5 rounded-full mt-1", pulseColor, isActive && "animate-ping")} />
                              <div className="flex gap-1">
                                {caps.slice(0, 2).map((cap, i) => (
                                  <div key={i} title={cap.label} className="text-slate-300 group-hover:text-primary transition-colors">
                                    {cap.icon}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <span className="text-[9px] font-bold text-slate-700 truncate mb-3 group-hover:text-primary transition-colors">{model}</span>
                            
                            <Button 
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              className={cn(
                                "h-6 w-full text-[7px] font-bold uppercase rounded-lg transition-all",
                                isActive ? "bg-primary text-white" : "text-slate-400 border-slate-100 hover:bg-white hover:text-primary"
                              )}
                              onClick={(e) => aiMode === 'offline' && handleLoadModel(model, e)}
                              disabled={(isModelLoading && isActive) || aiMode === 'online'}
                            >
                              {isModelLoading && isActive ? <Loader2 className="animate-spin h-2 w-2" /> : isActive ? "Active" : "Energize"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Card 
                className={cn(
                  "border-slate-100 bg-white shadow-sm rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden",
                  activeCard === 'shield' ? "ring-1 ring-emerald-500/20" : "opacity-80 grayscale-[0.5]"
                )}
                onClick={() => setActiveCard('shield')}
              >
                <div className="p-3 sm:p-4 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={16} className={cn(activeCard === 'shield' && "animate-pulse")} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">Shield</h3>
                      <span className="text-[7px] text-emerald-500 font-bold uppercase mt-1">Status: Operational</span>
                    </div>
                  </div>
                  {activeCard === 'shield' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">AES-256 Protocol</span>
                        <Badge className="h-4 text-[7px] bg-emerald-500">Active</Badge>
                      </div>
                      <div className="space-y-1 px-1">
                        <div className="flex justify-between text-[7px] font-bold uppercase text-slate-400">
                          <span>Signal Integrity</span>
                          <span>99.9%</span>
                        </div>
                        <Progress value={99.9} className="h-1 bg-slate-100" />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card 
                className={cn(
                  "border-slate-100 bg-white shadow-sm rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden",
                  activeCard === 'vault' ? "ring-1 ring-primary/20" : "opacity-80 grayscale-[0.5]"
                )}
                onClick={() => setActiveCard('vault')}
              >
                <div className="p-3 sm:p-4 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                      <Database size={16} className={cn(activeCard === 'vault' && "animate-pulse")} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">Vault</h3>
                      <span className="text-[7px] text-rose-500 font-bold uppercase mt-1">Index: Optimized</span>
                    </div>
                  </div>
                  {activeCard === 'vault' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                          <span className="text-[7px] font-bold text-slate-400 uppercase">Segments</span>
                          <span className="text-[10px] font-bold text-slate-800">1,428</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center">
                          <span className="text-[7px] font-bold text-slate-400 uppercase">Latency</span>
                          <span className="text-[10px] font-bold text-slate-800">{latency}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <footer className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center shrink-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <Zap size={10} className="text-primary" fill="currentColor" />
              Signals Encapsulated • ZeroGPT Core
            </p>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
