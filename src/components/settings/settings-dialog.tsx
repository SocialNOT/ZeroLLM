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
import { Settings2, Server, Shield, Database, Cpu, CheckCircle2, RefreshCw, Loader2, Wifi, WifiOff, Zap } from "lucide-react";
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

  const handleRefresh = async () => {
    if (conn) {
      updateConnection(conn.id, { baseUrl: urlInput });
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
        description: "Could not reach the load endpoint. Ensure your server supports model management.",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-white/20 bg-white/95 backdrop-blur-2xl overflow-hidden shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl font-bold flex items-center gap-3 text-slate-900">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Settings2 size={24} />
            </div>
            System Control Panel
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Orchestrate your local LLM engine nodes and knowledge base protocols.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="engine" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-2xl h-11">
            <TabsTrigger value="engine" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold uppercase tracking-tight text-[10px]">Engine Node</TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold uppercase tracking-tight text-[10px]">Privacy Guard</TabsTrigger>
            <TabsTrigger value="data" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold uppercase tracking-tight text-[10px]">Knowledge</TabsTrigger>
          </TabsList>
          
          <TabsContent value="engine" className="space-y-6 py-6 h-[420px] overflow-y-auto custom-scrollbar px-1">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Server size={18} className="text-primary" />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Network Config</h4>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[9px] uppercase font-bold gap-2 px-3 py-1 rounded-full border-2",
                    connectionStatus === 'online' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : "border-rose-100 text-rose-500 bg-rose-50"
                  )}>
                    {connectionStatus === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {connectionStatus}
                  </Badge>
                </div>
                
                <div className="grid gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engine Endpoint (HTTP/HTTPS)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={urlInput} 
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="rounded-xl border-slate-200 bg-white font-mono text-xs focus:ring-primary/20"
                        placeholder="http://localhost:11434/v1"
                      />
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-10 w-10 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary transition-colors"
                        onClick={handleRefresh}
                        disabled={connectionStatus === 'checking'}
                      >
                        {connectionStatus === 'checking' ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {connectionStatus === 'online' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Cpu size={18} className="text-primary" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Model Management</h4>
                    </div>
                    {conn?.modelId && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-8 text-[10px] font-bold uppercase gap-2 rounded-xl shadow-lg shadow-primary/20"
                        onClick={handleLoadModel}
                        disabled={isModelLoading}
                      >
                        {isModelLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Zap size={12} />}
                        Load to RAM
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Model Reference</Label>
                      <Input 
                        value={conn?.modelId || ""} 
                        onChange={(e) => conn && updateConnection(conn.id, { modelId: e.target.value })}
                        className="rounded-xl border-slate-200 bg-white font-mono text-xs"
                        placeholder="Enter model ID or select below"
                      />
                    </div>
                    
                    {availableModels.length > 0 ? (
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discovered Engines</Label>
                        <div className="flex flex-wrap gap-2">
                          {availableModels.map(model => (
                            <Badge 
                              key={model}
                              variant="outline"
                              className={cn(
                                "cursor-pointer transition-all text-[10px] py-1.5 px-3 rounded-xl border-2",
                                conn?.modelId === model 
                                  ? 'border-primary bg-primary/5 text-primary' 
                                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
                              )}
                              onClick={() => conn && updateConnection(conn.id, { modelId: model })}
                            >
                              {conn?.modelId === model && <CheckCircle2 size={10} className="mr-1.5" />}
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-white/50">
                        <p className="text-[10px] text-slate-400 font-medium">No pre-installed models detected on this node.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-10 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-center flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-white shadow-sm text-slate-300">
                    <Cpu size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-600">Model Discovery Inactive</p>
                    <p className="text-xs text-slate-400 max-w-[220px]">Establish a node connection to browse and activate your local engines.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="py-16 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="font-headline font-bold uppercase tracking-widest text-sm text-slate-900">Protocol: Air-Gapped Isolation</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">Aetheria maintains 100% local node isolation. Your telemetry and intelligence data never cross the public cloud perimeter.</p>
            </div>
          </TabsContent>

          <TabsContent value="data" className="py-16 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Database size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="font-headline font-bold uppercase tracking-widest text-sm text-slate-900">Neural Knowledge Graph</h4>
              <p className="text-sm text-slate-500">Semantic Vector Store: <span className="text-accent font-bold">OPTIMIZED</span></p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">342 Cognitive Chunks Indexed</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
