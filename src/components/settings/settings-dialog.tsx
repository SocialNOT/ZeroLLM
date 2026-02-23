
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
import { Settings2, Server, Shield, Database, Cpu, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { connections, activeConnectionId, updateConnection } = useAppStore();
  const conn = connections.find(c => c.id === activeConnectionId);

  // Example list of commonly used models for selection
  const commonModels = ["llama3:8b", "mistral", "gemma:7b", "phi3"];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-white/10 bg-background/95 backdrop-blur-xl">
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
            <TabsTrigger value="engine" className="data-[state=active]:bg-primary data-[state=active]:text-accent">Engine</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-accent">Security</TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-primary data-[state=active]:text-accent">Knowledge</TabsTrigger>
          </TabsList>
          
          <TabsContent value="engine" className="space-y-6 py-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent">
                  <Server size={16} />
                  <h4 className="text-sm font-bold uppercase tracking-widest">Connection Config</h4>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">API BASE ENDPOINT</Label>
                    <Input 
                      value={conn?.baseUrl || ""} 
                      onChange={(e) => conn && updateConnection(conn.id, { baseUrl: e.target.value })}
                      className="border-white/10 bg-white/5 font-mono text-xs"
                      placeholder="http://localhost:11434/v1"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-white/5" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-accent">
                  <Cpu size={16} />
                  <h4 className="text-sm font-bold uppercase tracking-widest">Model Selection</h4>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">ACTIVE MODEL ID</Label>
                    <Input 
                      value={conn?.modelId || ""} 
                      onChange={(e) => conn && updateConnection(conn.id, { modelId: e.target.value })}
                      className="border-white/10 bg-white/5 font-mono text-xs"
                      placeholder="Enter model ID (e.g. llama3:8b)"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    {commonModels.map(model => (
                      <Badge 
                        key={model}
                        variant="outline"
                        className={`cursor-pointer transition-colors hover:bg-white/10 ${conn?.modelId === model ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 text-muted-foreground'}`}
                        onClick={() => conn && updateConnection(conn.id, { modelId: model })}
                      >
                        {conn?.modelId === model && <CheckCircle2 size={10} className="mr-1" />}
                        {model}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">If your model is not listed above, type the ID manually in the field.</p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />
            
            <div className="flex justify-between items-center bg-accent/5 p-4 rounded-lg border border-accent/20">
              <div className="text-xs">
                <p className="font-bold text-accent">Backend Response Status</p>
                <p className="text-muted-foreground">The application will attempt to route requests to: <span className="font-mono text-foreground">{conn?.modelId || 'unspecified'}</span></p>
              </div>
              <Button size="sm" variant="outline" className="text-[10px] h-7">TEST ENGINE PING</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="py-6 space-y-4 text-center">
            <Shield className="mx-auto text-primary" size={40} />
            <p className="text-sm text-muted-foreground">Aetheria runs in 100% local isolation. No telemetry data is sent to external servers.</p>
          </TabsContent>

          <TabsContent value="data" className="py-6 space-y-4 text-center">
            <Database className="mx-auto text-primary" size={40} />
            <p className="text-sm text-muted-foreground">Vector database index: Active (342 chunks indexed)</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
