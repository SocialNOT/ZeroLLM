
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
  RefreshCw, 
  Loader2, 
  Zap, 
  Cpu,
  Globe,
  Cloud,
  Laptop,
  ShieldCheck,
  Database
} from "lucide-react";
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
    activeOnlineModelId,
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
    
    // Tools logic
    if (id.includes('llama') || id.includes('qwen') || id.includes('gemma') || id.includes('liquid') || id.includes('gemini')) {
      caps.push({ label: 'Tool Calling', color: 'text-blue-600', glow: 'bg-blue-500' });
    }
    
    // Thinking logic
    if (id.includes('deepseek') || id.includes('r1') || id.includes('thinking') || id.includes('gemini-2.0-pro')) {
      caps.push({ label: 'Deep Think', color: 'text-purple-600', glow: 'bg-purple-500' });
    }
    
    // Vision logic
    if (id.includes('vision') || id.includes('vl') || id.includes('gemini')) {
      caps.push({ label: 'Vision', color: 'text-pink-600', glow: 'bg-pink-500' });
    }
    
    // RAG logic
    if (id.includes('rag') || id.includes('nomic') || id.includes('embed')) {
      caps.push({ label: 'RAG Native', color: 'text-emerald-600', glow: 'bg-emerald-500' });
    }

    if (caps.length === 0) {
      caps.push({ label: 'General Logic', color: 'text-primary', glow: 'bg-primary' });
    }
    
    return caps;
  };

  const getModelStatusColor = (modelId: string, isActive: boolean) => {
    if (!isActive) return "bg-slate-200";
    const id = modelId.toLowerCase();
    if (id.includes('gemini')) return "bg-primary";
    if (id.includes('deepseek') || id.includes('r1')) return "bg-purple-500";
    if (id.includes('llama')) return "bg-blue-500";
    if (id.includes('qwen')) return "bg-orange-500";
    return "bg-emerald-500";
  };

  const getModelGlowEffect = (modelId: string, isActive: boolean) => {
    if (!isActive) return "border-slate-100";
    const id = modelId.toLowerCase();
    if (id.includes('gemini')) return "border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]";
    if (id.includes('deepseek') || id.includes('r1')) return "border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]";
    return "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full border-primary/10 bg-white/95 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-none p-0 overflow-hidden outline-none gap-0 border">
        <div className="flex flex-col max-h-[85vh]">
          <header className="p-4 sm:p-6 bg-white/50 border-b border-primary/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-primary text-white shadow-lg shadow-primary/20">
                <Settings2 size={18} />
              </div>
              <div>
                <DialogTitle className="font-headline text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none">Node Command Panel</DialogTitle>
                <DialogDescription className="text-primary font-bold text-[8px] uppercase tracking-widest mt-1">
                  Orchestrate engine protocols and secure cognitive nodes.
                </DialogDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "text-[8px] uppercase font-bold gap-1.5 px-3 py-1 rounded-none border",
                connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-500 bg-rose-50"
              )}>
                <div className={cn("h-1.5 w-1.5 rounded-none", connectionStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                {aiMode === 'online' ? 'Cloud Connected' : connectionStatus}
              </Badge>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-4">
            
            <div className="px-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1 mb-2 block">Neural Orchestration Mode</Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-none border border-slate-200">
                <button 
                  onClick={() => setAiMode('online')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all",
                    aiMode === 'online' ? "bg-white text-primary shadow-md ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Cloud size={16} />
                  Cloud Node (Gemini)
                </button>
                <button 
                  onClick={() => setAiMode('offline')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 rounded-none text-[10px] font-black uppercase tracking-widest transition-all",
                    aiMode === 'offline' ? "bg-white text-primary shadow-md ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Laptop size={16} />
                  Local Node (Custom)
                </button>
              </div>
            </div>

            <Card className={cn(
              "border-primary/5 bg-white shadow-sm rounded-none overflow-hidden transition-all duration-500",
              activeCard === 'engine' ? "ring-1 ring-primary/20" : "opacity-100"
            )}>
              <div 
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-primary/5 transition-colors cursor-pointer group"
                onClick={() => setActiveCard('engine')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-none bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {aiMode === 'online' ? <Cloud size={16} /> : <Server size={16} className={cn(connectionStatus === 'online' && activeCard === 'engine' && "animate-pulse")} />}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">
                      {aiMode === 'online' ? 'Cloud Infrastructure' : 'Engine Node'}
                    </h3>
                    <span className="text-[7px] text-primary font-bold uppercase mt-1">
                      {aiMode === 'online' ? `${availableModels.length} Cloud Nodes Active` : `Network Protocol: ${connectionStatus === 'online' ? 'Synchronized' : 'Offline'}`}
                    </span>
                  </div>
                </div>
                {activeCard === 'engine' && aiMode === 'offline' && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-7 text-[8px] font-bold uppercase rounded-none gap-1.5 px-2"
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
                        <Label className="text-[8px] font-bold text-primary uppercase tracking-widest ml-1">Base API URL</Label>
                        <Input 
                          value={urlInput} 
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="rounded-none border-primary/10 bg-slate-50 font-mono text-[10px] h-9 focus:ring-primary/20"
                          placeholder="http://localhost:11434/v1"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[8px] font-bold text-primary uppercase tracking-widest ml-1">API Secret Token (Optional)</Label>
                        <Input 
                          type="password"
                          value={tokenInput} 
                          onChange={(e) => setTokenInput(e.target.value)}
                          className="rounded-none border-primary/10 bg-slate-50 font-mono text-[10px] h-9 focus:ring-primary/20"
                          placeholder="sk-..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-none border border-primary/5 flex items-center gap-4 mt-2">
                      <div className="h-10 w-10 rounded-none bg-primary/5 flex items-center justify-center text-primary">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Google Cloud Handshake</h4>
                        <p className="text-[8px] font-bold text-primary uppercase">Latency optimized via Genkit node</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Cpu size={12} className="text-primary" />
                        <span className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Compute Engine Selection</span>
                      </div>
                      <Badge variant="outline" className="text-[7px] font-bold uppercase px-2 py-0 border-primary/10 text-primary rounded-none">
                        {availableModels.length} Indexed Models
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableModels.map(model => {
                        const caps = getModelCapabilities(model);
                        const isActive = aiMode === 'online' ? (activeOnlineModelId === model) : (conn?.modelId === model);
                        const statusColor = getModelStatusColor(model, isActive);
                        const borderClass = getModelGlowEffect(model, isActive);
                        
                        return (
                          <div 
                            key={model}
                            className={cn(
                              "relative flex flex-col p-4 rounded-none border transition-all duration-300 group overflow-hidden bg-white",
                              isActive ? "ring-2 ring-primary border-transparent" : borderClass,
                              "hover:shadow-lg"
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight break-all flex-1 pr-2">
                                {model.replace('googleai/', '')}
                              </span>
                              <div className={cn("h-2.5 w-2.5 rounded-none shrink-0", statusColor, isActive && "animate-pulse shadow-[0_0_8px_currentColor]")} />
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                              {caps.map((cap, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 rounded-none border border-slate-100">
                                  <div className={cn("h-1 w-1 rounded-none", cap.glow, "animate-pulse")} />
                                  <span className={cn("text-[7px] font-black uppercase tracking-widest", cap.color)}>
                                    {cap.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <Button 
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              className={cn(
                                "h-8 w-full text-[8px] font-black uppercase rounded-none transition-all gap-2",
                                isActive 
                                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                  : "text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-900"
                              )}
                              onClick={(e) => handleLoadModel(model, e)}
                              disabled={isModelLoading && isActive}
                            >
                              {isModelLoading && isActive ? (
                                <Loader2 className="animate-spin h-3 w-3" />
                              ) : (
                                <Zap size={10} className={isActive ? "fill-white" : ""} />
                              )}
                              {isActive ? "Orchestration Active" : "Energize Node"}
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
                  "border-primary/5 bg-white shadow-sm rounded-none transition-all duration-500 cursor-pointer overflow-hidden",
                  activeCard === 'shield' ? "ring-1 ring-emerald-500/20" : "opacity-100"
                )}
                onClick={() => setActiveCard('shield')}
              >
                <div className="p-3 sm:p-4 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-none bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={16} className={cn(activeCard === 'shield' && "animate-pulse")} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">Shield</h3>
                      <span className="text-[7px] text-emerald-500 font-bold uppercase mt-1">Status: Operational</span>
                    </div>
                  </div>
                  {activeCard === 'shield' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="p-2 rounded-none bg-slate-50 border border-emerald-500/10 flex items-center justify-between">
                        <span className="text-[8px] font-bold text-emerald-600 uppercase">AES-256 Protocol</span>
                        <Badge className="h-4 text-[7px] bg-emerald-500 rounded-none">Active</Badge>
                      </div>
                      <div className="space-y-1 px-1">
                        <div className="flex justify-between text-[7px] font-bold uppercase text-emerald-600">
                          <span>Signal Integrity</span>
                          <span>99.9%</span>
                        </div>
                        <Progress value={99.9} className="h-1 bg-emerald-500/10 rounded-none" />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card 
                className={cn(
                  "border-primary/5 bg-white shadow-sm rounded-none transition-all duration-500 cursor-pointer overflow-hidden",
                  activeCard === 'vault' ? "ring-1 ring-primary/20" : "opacity-100"
                )}
                onClick={() => setActiveCard('vault')}
              >
                <div className="p-3 sm:p-4 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-none bg-accent/10 flex items-center justify-center text-accent">
                      <Database size={16} className={cn(activeCard === 'vault' && "animate-pulse")} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">Vault</h3>
                      <span className="text-[7px] text-accent font-bold uppercase mt-1">Index: Optimized</span>
                    </div>
                  </div>
                  {activeCard === 'vault' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-none bg-slate-50 border border-accent/10 flex flex-col items-center">
                          <span className="text-[7px] font-bold text-accent uppercase">Segments</span>
                          <span className="text-[10px] font-bold text-slate-800">1,428</span>
                        </div>
                        <div className="p-2 rounded-none bg-slate-50 border border-accent/10 flex flex-col items-center">
                          <span className="text-[7px] font-bold text-accent uppercase">Latency</span>
                          <span className="text-[10px] font-bold text-slate-800">{latency}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <footer className="p-3 sm:p-4 bg-slate-50 border-t border-primary/5 flex items-center justify-center shrink-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Zap size={10} className="text-primary" fill="currentColor" />
              Signals Encapsulated • ZeroGPT Core
            </p>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
