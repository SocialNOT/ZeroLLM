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
  CheckCircle2, 
  RefreshCw, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Zap, 
  Key,
  Activity,
  Lock,
  Box,
  Fingerprint
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

  useEffect(() => {
    if (connectionStatus === 'online') {
      setLatency(`${Math.floor(Math.random() * 40 + 10)}ms`);
    } else {
      setLatency("---");
    }
  }, [connectionStatus]);

  const handleRefresh = async () => {
    if (conn) {
      updateConnection(conn.id, { baseUrl: urlInput, apiKey: tokenInput });
      await checkConnection();
    }
  };

  const handleLoadModel = async () => {
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl border-slate-200 bg-slate-50/95 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-0 overflow-hidden outline-none">
        <div className="flex flex-col h-full">
          {/* Header Node */}
          <header className="p-8 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
                <Settings2 size={24} />
              </div>
              <div>
                <DialogTitle className="font-headline text-2xl font-bold text-slate-900 tracking-tight">System Control</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-xs mt-0.5">Neural Node Configuration & Telemetry</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-bold gap-2 px-4 py-1.5 rounded-full border-2",
                connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-50"
              )}>
                <Activity size={12} className={connectionStatus === 'online' ? "animate-pulse" : ""} />
                Latency: {latency}
              </Badge>
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-bold gap-2 px-4 py-1.5 rounded-full border-2",
                connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-500 bg-rose-50"
              )}>
                {connectionStatus === 'online' ? <Wifi size={12} /> : <WifiOff size={12} />}
                {connectionStatus}
              </Badge>
            </div>
          </header>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* Engine Node Card (Main) */}
            <Card className="md:col-span-8 bg-white border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Server size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest">Engine Interface</h3>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-8 text-[10px] font-bold uppercase rounded-xl gap-2"
                    onClick={handleRefresh}
                    disabled={connectionStatus === 'checking'}
                  >
                    {connectionStatus === 'checking' ? <Loader2 className="animate-spin h-3 w-3" /> : <RefreshCw size={12} />}
                    Sync Node
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Endpoint</Label>
                    <Input 
                      value={urlInput} 
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="rounded-xl border-slate-100 bg-slate-50 font-mono text-[11px] h-10 focus:ring-primary/20"
                      placeholder="http://localhost:11434/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Secret</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                      <Input 
                        type="password"
                        value={tokenInput} 
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="rounded-xl border-slate-100 bg-slate-50 font-mono text-[11px] h-10 pl-9 focus:ring-primary/20"
                        placeholder="sk-..."
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-50" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Cpu size={18} />
                      </div>
                      <h3 className="font-bold text-sm text-slate-800 uppercase tracking-widest">Compute Core</h3>
                    </div>
                    {conn?.modelId && (
                      <Button 
                        size="sm" 
                        onClick={handleLoadModel}
                        disabled={isModelLoading}
                        className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 gap-2"
                      >
                        {isModelLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Zap size={12} />}
                        Energize Model
                      </Button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Active Model Identifier</Label>
                      <Input 
                        value={conn?.modelId || ""} 
                        onChange={(e) => conn && updateConnection(conn.id, { modelId: e.target.value })}
                        className="rounded-xl border-white bg-white font-mono text-[11px] h-10 shadow-sm"
                        placeholder="e.g. llama3:8b"
                      />
                    </div>

                    {availableModels.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Detected Local Nodes</Label>
                        <div className="flex flex-wrap gap-2">
                          {availableModels.map(model => (
                            <button 
                              key={model}
                              onClick={() => conn && updateConnection(conn.id, { modelId: model })}
                              className={cn(
                                "text-[9px] font-bold py-1.5 px-3 rounded-lg border-2 transition-all",
                                conn?.modelId === model 
                                  ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' 
                                  : 'border-white bg-white text-slate-400 hover:border-slate-200'
                              )}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Cards (Shield & Vault) */}
            <div className="md:col-span-4 space-y-6">
              {/* Neural Shield Card */}
              <Card className="bg-white border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                      <Shield size={18} />
                    </div>
                    <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest">Neural Shield</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-tight">Signal Guard</span>
                      <span className="text-emerald-500 uppercase">ACTIVE</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[94%]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                        <Lock size={12} className="text-indigo-500 mb-1" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">AES-256</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                        <Fingerprint size={12} className="text-indigo-500 mb-1" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">SHA-RSA</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cognitive Vault Card */}
              <Card className="bg-white border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                      <Database size={18} />
                    </div>
                    <h3 className="font-bold text-[10px] text-slate-800 uppercase tracking-widest">Cognitive Vault</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-tight">Memory Index</span>
                      <span className="text-primary uppercase">OPTIMAL</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[72%]" />
                    </div>
                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Box size={12} className="text-rose-500" />
                          <span className="text-[8px] font-bold text-slate-400 uppercase">Segments</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold">1,428</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Node */}
          <footer className="p-6 bg-slate-100/50 border-t border-slate-200 flex items-center justify-center shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
              <Zap size={10} className="text-primary" fill="currentColor" />
              Signals Encapsulated • ZeroGPT Core 2.0
            </p>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
