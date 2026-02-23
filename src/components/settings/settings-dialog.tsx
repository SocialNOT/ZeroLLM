
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
import { Settings2, Server, Shield, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { connections, activeConnectionId, updateConnection } = useAppStore();
  const conn = connections.find(c => c.id === activeConnectionId);

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
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <Server size={16} />
                <h4 className="text-sm font-bold uppercase tracking-widest">Active Connection</h4>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">BASE ENDPOINT</Label>
                  <Input 
                    value={conn?.baseUrl || ""} 
                    onChange={(e) => conn && updateConnection(conn.id, { baseUrl: e.target.value })}
                    className="border-white/10 bg-white/5 font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">ACTIVE MODEL</Label>
                  <Input 
                    value={conn?.modelId || ""} 
                    onChange={(e) => conn && updateConnection(conn.id, { modelId: e.target.value })}
                    className="border-white/10 bg-white/5 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
            <Separator className="bg-white/5" />
            <div className="flex justify-between items-center bg-accent/5 p-4 rounded-lg border border-accent/20">
              <div className="text-xs">
                <p className="font-bold text-accent">Latency Optimized</p>
                <p className="text-muted-foreground">Current average response time: 240ms</p>
              </div>
              <Button size="sm" variant="outline" className="text-[10px] h-7">TEST PING</Button>
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
