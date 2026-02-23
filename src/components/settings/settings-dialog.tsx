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

  const handleRefresh = async () => {
    await checkConnection();
  };

  const handleLoadModel = async () => {
    if (!conn?.modelId) return;
    const success = await triggerModelLoad(conn.modelId);
    if (success) {
      toast({
        title: "Model Loaded",
        description: `${conn.modelId} is now active in memory.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Load Failed",
        description: "Could not load model. Check server logs.",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-white/10 bg-background/95 backdrop-blur-xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl font-bold flex items-center gap-2">
            <Settings2 className="text-accent" size={20} />
            System Control Panel
          </DialogTitle>
          <DialogDescription>
            Manage your AI backend configurations and privacy settings.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="engine" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="engine" className="data-[state=active]:bg-primary data-[state=active]:text-accent font-bold uppercase tracking-tighter text-[10px]">Engine</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-accent font-bold uppercase tracking-tighter text-[10px]">Security</TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-primary data-[state=active]:text-accent font-bold uppercase tracking-tighter text-[10px]">Knowledge</TabsTrigger>
          </TabsList>
          
          <TabsContent value="engine" className="space-y-6 py-6 h-[400px] overflow-y-auto custom-scrollbar px-1">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-accent">
                  <div className="flex items-center gap-2">
                    <Server size={16} />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Connection Config</h4>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[8px] uppercase font-bold gap-1.5",
                    connectionStatus === 'online' ? "border-accent text-accent bg-accent/10" : "border-red-500/50 text-red-400 bg-red-500/10"
                  )}>
                    {connectionStatus === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {connectionStatus}
                  </Badge>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">API BASE ENDPOINT</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={conn?.baseUrl || ""} 
                        onChange={(e) => conn && updateConnection(conn.id, { baseUrl: e.target.value })}
                        className="border-white/10 bg-white/5 font-mono text-xs"
                        placeholder="http://localhost:11434/v1"
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-10 w-10 shrink-0 border-white/10"
                        onClick={handleRefresh}
                        disabled={connectionStatus === 'checking'}
                      >
                        {connectionStatus === 'checking' ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/5" />

              {connectionStatus === 'online' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-accent">
                      <Cpu size={16} />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Model Management</h4>
                    </div>
                    {conn?.modelId && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-7 text-[10px] font-bold uppercase gap-2"
                        onClick={handleLoadModel}
                        disabled={isModelLoading}
                      >
                        {isModelLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Zap size={12} />}
                        Load to Memory
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">ACTIVE MODEL ID</Label>
                      <Input 
                        value={conn?.modelId || ""} 
                        onChange={(e) => conn && updateConnection(conn.id, { modelId: e.target.value })}
                        className="border-white/10 bg-white/5 font-mono text-xs"
                        placeholder="Enter model ID manually or select below"
                      />
                    </div>
                    
                    {availableModels.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Installed Models</Label>
                        <div className="flex flex-wrap gap-2">
                          {availableModels.map(model => (
                            <Badge 
                              key={model}
                              variant="outline"
                              className={cn(
                                "cursor-pointer transition-all text-[10px] py-1",
                                conn?.modelId === model 
                                  ? 'border-accent bg-accent/20 text-accent shadow-[0_0_10px_rgba(0,255,255,0.2)]' 
                                  : 'border-white/10 text-muted-foreground hover:bg-white/5'
                              )}
                              onClick={() => conn && updateConnection(conn.id, { modelId: model })}
                            >
                              {conn?.modelId === model && <CheckCircle2 size={10} className="mr-1" />}
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border border-dashed border-white/10 text-center">
                        <p className="text-[10px] text-muted-foreground italic">No models returned from server. Try refreshing or enter manually above.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-white/5 bg-white/[0.02] text-center flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-white/5 text-muted-foreground">
                    <Cpu size={24} className="opacity-20" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium max-w-[200px]">
                    Model selector will become active once a connection is established.
                  </p>
                </div>
              )}
            </div>

            <Separator className="bg-white/5" />
            
            <div className="flex justify-between items-center bg-accent/5 p-4 rounded-lg border border-accent/20">
              <div className="text-xs">
                <p className="font-bold text-accent uppercase tracking-tighter">Backend Status</p>
                <p className="text-muted-foreground text-[10px]">Endpoint: <span className="font-mono text-foreground">{conn?.baseUrl}</span></p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-[10px] h-7 font-bold uppercase"
                onClick={handleRefresh}
                disabled={connectionStatus === 'checking'}
              >
                Ping Engine
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="py-12 space-y-4 text-center">
            <Shield className="mx-auto text-primary" size={40} />
            <h4 className="font-headline font-bold uppercase tracking-widest text-sm">Enterprise Security</h4>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Aetheria runs in 100% local isolation. No telemetry data or prompts are sent to external cloud providers.</p>
          </TabsContent>

          <TabsContent value="data" className="py-12 space-y-4 text-center">
            <Database className="mx-auto text-primary" size={40} />
            <h4 className="font-headline font-bold uppercase tracking-widest text-sm">Knowledge Graph</h4>
            <p className="text-sm text-muted-foreground">Vector database status: <span className="text-accent font-bold">READY</span></p>
            <p className="text-[10px] text-muted-foreground italic">342 chunks indexed for RAG retrieval.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
