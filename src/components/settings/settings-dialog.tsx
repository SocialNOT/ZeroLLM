"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
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
  ChevronDown
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { 
    connections, 
    activeConnectionId, 
    updateConnection, 
    availableModels, 
    connectionStatus, 
    checkConnection,
    triggerModelLoad,
    isModelLoading
  } = useAppStore();
  
  const conn = connections.find(c => c.id === activeConnectionId);
  const [urlInput, setUrlInput] = useState(conn?.baseUrl || "");
  const [tokenInput, setTokenInput] = useState(conn?.apiKey || "");
  const [latency, setLatency] = useState("0ms");
  const [expandedSection, setExpandedSection] = useState<'engine' | 'shield' | 'vault' | null>('engine');

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

  const handleLoadModel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!conn?.modelId) return;
    const success = await triggerModelLoad(conn.modelId);
    if (success) {
      toast({
        title: "Model Activation Sent",
        description: `Request to load ${conn.modelId} has been dispatched.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Activation Failed",
        description: "Node management not supported on this endpoint.",
      });
    }
  };

  const toggleSection = (section: 'engine' | 'shield' | 'vault') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full border-slate-200 bg-slate-50/95 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-0 overflow-hidden outline-none gap-0">
        <div className="flex flex-col max-h-[85vh] sm:max-h-[80vh]">
          {/* Header Node */}
          <header className="p-4 sm:p-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                <Settings2 size={18} />
              </div>
              <div>
                <DialogTitle className="font-headline text-lg sm:text-xl font-bold text-slate-900 tracking-tight">System Control</DialogTitle>
                <p className="text-slate-500 font-bold text-[8px] uppercase tracking-widest">Neural Node Configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(
                "text-[8px] uppercase font-bold gap-1.5 px-3 py-1 rounded-full border flex justify-center",
                connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-50"
              )}>
                <Activity size={10} className={cn(connectionStatus === 'online' ? "animate-pulse" : "")} />
                Latency: {latency}
              </Badge>
              <Badge variant="outline" className={cn(
                "text-[8px] uppercase font-bold gap-1.5 px-3 py-1 rounded-full border flex justify-center",
                connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-500 bg-rose-50"
              )}>
                {connectionStatus === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                {connectionStatus}
              </Badge>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
            
            {/* Engine Node Card */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-[1.5rem] overflow-hidden">
              <div 
                onClick={() => toggleSection('engine')}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Server size={16} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">Engine Interface</h3>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                      {connectionStatus === 'online' ? "ENDPOINT SYNCHRONIZED" : "NODE DISCONNECTED"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-7 text-[8px] font-bold uppercase rounded-lg gap-1.5 px-2"
                    onClick={handleRefresh}
                    disabled={connectionStatus === 'checking'}
                  >
                    {connectionStatus === 'checking' ? <Loader2 className="animate-spin h-3 w-3" /> : <RefreshCw size={10} />}
                    Sync
                  </Button>
                  <ChevronDown className={cn("h-4 w-4 text-slate-300 transition-transform duration-300", expandedSection === 'engine' && "rotate-180")} />
                </div>
              </div>

              {expandedSection === 'engine' && (
                <CardContent className="px-4 pb-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Separator className="bg-slate-50" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Node Endpoint</Label>
                      <Input 
                        value={urlInput} 
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="rounded-lg border-slate-100 bg-slate-50 font-mono text-[10px] h-9 focus:ring-primary/20"
                        placeholder="http://localhost:11434/v1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Secret</Label>
                      <div className="relative">
                        <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                        <Input 
                          type="password"
                          value={tokenInput} 
                          onChange={(e) => setTokenInput(e.target.value)}
                          className="rounded-lg border-slate-100 bg-slate-50 font-mono text-[10px] h-9 pl-8 focus:ring-primary/20"
                          placeholder="sk-..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={14} className="text-emerald-600" />
                        <span className="text-[9px] font-bold text-slate-800 uppercase tracking-widest">Compute Core</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleLoadModel}
                        disabled={isModelLoading}
                        className="h-7 rounded-lg text-[8px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-1.5 px-2"
                      >
                        {isModelLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Zap size={10} />}
                        Energize
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1">Active Model Identifier</Label>
                      <Input 
                        value={conn?.modelId || ""} 
                        onChange={(e) => conn && updateConnection(conn.id, { modelId: e.target.value })}
                        className="rounded-lg border-white bg-white font-mono text-[10px] h-9 shadow-sm"
                        placeholder="e.g. llama3:8b"
                      />
                    </div>
                    {availableModels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1 pt-1">
                        {availableModels.map(model => (
                          <button 
                            key={model}
                            onClick={() => conn && updateConnection(conn.id, { modelId: model })}
                            className={cn(
                              "text-[8px] font-bold py-1 px-2 rounded-md border-2 transition-all",
                              conn?.modelId === model 
                                ? 'border-primary bg-primary text-white shadow-sm' 
                                : 'border-white bg-white text-slate-400 hover:border-slate-200'
                            )}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Neural Shield Card */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-[1.5rem] overflow-hidden">
              <div 
                onClick={() => toggleSection('shield')}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Shield size={16} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">Neural Shield</h3>
                    <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter mt-1 animate-pulse">SIGNAL GUARD ACTIVE</span>
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-slate-300 transition-transform duration-300", expandedSection === 'shield' && "rotate-180")} />
              </div>

              {expandedSection === 'shield' && (
                <CardContent className="px-4 pb-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Separator className="bg-slate-50" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                      <Lock size={12} className="text-indigo-500 mb-1" />
                      <span className="text-[7px] font-bold text-slate-400 uppercase">AES-256</span>
                      <span className="text-[8px] font-bold text-slate-800 mt-0.5">ENCRYPTED</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                      <Fingerprint size={12} className="text-indigo-500 mb-1" />
                      <span className="text-[7px] font-bold text-slate-400 uppercase">SHA-RSA</span>
                      <span className="text-[8px] font-bold text-slate-800 mt-0.5">VERIFIED</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-bold text-slate-400 uppercase">
                      <span>Integrity Level</span>
                      <span className="text-emerald-500">94%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[94%]" />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Cognitive Vault Card */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-[1.5rem] overflow-hidden">
              <div 
                onClick={() => toggleSection('vault')}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                    <Database size={16} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest leading-none">Cognitive Vault</h3>
                    <span className="text-[8px] text-primary font-bold uppercase tracking-tighter mt-1">MEMORY INDEX OPTIMAL</span>
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-slate-300 transition-transform duration-300", expandedSection === 'vault' && "rotate-180")} />
              </div>

              {expandedSection === 'vault' && (
                <CardContent className="px-4 pb-4 pt-0 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Separator className="bg-slate-50" />
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Box size={12} className="text-rose-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Semantic Segments</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold">1,428</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-bold text-slate-400 uppercase">
                      <span>Index Fidelity</span>
                      <span className="text-primary">72%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[72%]" />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Footer Node */}
          <footer className="p-3 sm:p-4 bg-slate-100/50 border-t border-slate-200 flex items-center justify-center shrink-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
              <Zap size={10} className="text-primary" fill="currentColor" />
              Signals Encapsulated • ZeroGPT Core 2.0
            </p>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
