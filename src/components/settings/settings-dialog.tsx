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
import { Settings2, Server, Shield, Database, Cpu, CheckCircle2, RefreshCw, Loader2, Wifi, WifiOff, Zap, Key } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

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
      <DialogContent className="max-w-2xl border-white/20 bg-white/95 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[3rem]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-3 text-slate-900">
            <div className="p-2.5 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <Settings2 size={24} />
            </div>
            Node Command Panel
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium px-1 mt-1">
            Orchestrate engine protocols and secure cognitive nodes.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="engine" className="mt-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1.5 rounded-[1.75rem] h-12">
            <TabsTrigger value="engine" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl font-bold uppercase tracking-widest text-[10px]">Engine Node</TabsTrigger>
            <TabsTrigger value="security" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl font-bold uppercase tracking-widest text-[10px]">Shield</TabsTrigger>
            <TabsTrigger value="data" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl font-bold uppercase tracking-widest text-[10px]">Vault</TabsTrigger>
          </TabsList>
          
          <TabsContent value="engine" className="space-y-6 py-6 h-[400px] overflow-y-auto custom-scrollbar px-1">
            <div className="space-y-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Server size={18} className="text-primary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60">Network Protocol</h4>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[9px] uppercase font-bold gap-2 px-4 py-1.5 rounded-full border-2",
                    connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-500 bg-rose-50"
                  )}>
                    {connectionStatus === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {connectionStatus}
                  </Badge>
                </div>
                
                <div className="grid gap-5 p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base API URL</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={urlInput} 
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="rounded-2xl border-slate-200 bg-white font-mono text-xs focus:ring-primary/20 h-12"
                        placeholder="http://localhost:11434/v1"
                      />
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-12 w-12 shrink-0 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-primary transition-all"
                        onClick={handleRefresh}
                        disabled={connectionStatus === 'checking'}
                      >
                        {connectionStatus === 'checking' ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">API Secret Token (Optional)</Label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      <Input 
                        type="password"
                        value={tokenInput} 
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="rounded-2xl border-slate-200 bg-white font-mono text-xs pl-12 h-12"
                        placeholder="sk-..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100 opacity-50" />

              {connectionStatus === 'online' ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Cpu size={18} className="text-primary" />
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60">Compute Engine</h4>
                    </div>
                    {conn?.modelId && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2 rounded-2xl shadow-xl shadow-primary/20"
                        onClick={handleLoadModel}
                        disabled={isModelLoading}
                      >
                        {isModelLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Zap size={12} />}
                        Energize Node
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-5 p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Model ID</Label>
                      <Input 
                        value={conn?.modelId || ""} 
                        onChange={(e) => conn && updateConnection(conn.id, { modelId: e.target.value })}
                        className="rounded-2xl border-slate-200 bg-white font-mono text-xs h-12"
                        placeholder="e.g. gemma:2b"
                      />
                    </div>
                    
                    {availableModels.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indexed Models</Label>
                        <div className="flex flex-wrap gap-2">
                          {availableModels.map(model => (
                            <Badge 
                              key={model}
                              variant="outline"
                              className={cn(
                                "cursor-pointer transition-all text-[10px] font-bold py-2 px-4 rounded-2xl border-2",
                                conn?.modelId === model 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-white'
                              )}
                              onClick={() => conn && updateConnection(conn.id, { modelId: model })}
                            >
                              {conn?.modelId === model && <CheckCircle2 size={12} className="mr-2" />}
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 text-center flex flex-col items-center gap-5">
                  <div className="p-5 rounded-[2rem] bg-white shadow-xl text-slate-200">
                    <Cpu size={36} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-600">Model Index Inactive</p>
                    <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed">Establish a protocol handshake to browse and energize cognitive nodes.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="py-20 space-y-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-xl">
              <Shield size={36} />
            </div>
            <div className="space-y-2">
              <h4 className="font-headline font-bold uppercase tracking-widest text-sm text-slate-900 leading-loose">Protocol Isolation</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">Your node signals are encapsulated. Encryption protocols active across all cognitive pathways.</p>
            </div>
          </TabsContent>

          <TabsContent value="data" className="py-20 space-y-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-xl">
              <Database size={36} />
            </div>
            <div className="space-y-2">
              <h4 className="font-headline font-bold uppercase tracking-widest text-sm text-slate-900 leading-loose">Cognitive Vault</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">384 semantic segments indexed. Knowledge graph integrity: <span className="text-emerald-500 font-bold">OPTIMAL</span></p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
