"use client";

import { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Wrench, 
  Layers, 
  UserCircle, 
  Type, 
  Plus, 
  Check, 
  Zap, 
  FlaskConical,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function ParameterControls() {
  const { 
    activeSessionId, 
    sessions, 
    updateSessionSettings, 
    frameworks, 
    personas, 
    linguisticControls,
    applyFramework,
    applyPersona,
    applyLinguisticControl,
    activeParameterTab,
    setActiveParameterTab
  } = useAppStore();

  const [isDeveloping, setIsDeveloping] = useState(false);
  const session = sessions.find(s => s.id === activeSessionId);

  if (!session) return null;

  return (
    <div className="flex flex-col h-full bg-card">
      <Tabs value={activeParameterTab} onValueChange={setActiveParameterTab} className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1.5 rounded-none border-b border-border h-12">
          <TabsTrigger value="frameworks" className="text-[10px] font-bold uppercase tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Layers size={12} />
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="personas" className="text-[10px] font-bold uppercase tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserCircle size={12} />
            Personas
          </TabsTrigger>
          <TabsTrigger value="linguistic" className="text-[10px] font-bold uppercase tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Type size={12} />
            Linguistic
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-8 pb-20">
              {/* Frameworks Tab */}
              <TabsContent value="frameworks" className="mt-0 space-y-6 outline-none">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-primary" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Architectural Protocols</Label>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-widest text-primary gap-1" onClick={() => setIsDeveloping(!isDeveloping)}>
                    <Plus size={10} /> {isDeveloping ? "Done" : "Develop"}
                  </Button>
                </div>

                <div className="grid gap-3">
                  {frameworks.map(f => (
                    <div 
                      key={f.id} 
                      onClick={() => applyFramework(session.id, f.id)}
                      className={cn(
                        "p-4 rounded-[1.5rem] border transition-all cursor-pointer group",
                        session.frameworkId === f.id 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]" 
                          : "bg-muted/30 border-border hover:border-primary/30 hover:bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[11px] font-bold", session.frameworkId === f.id ? "text-primary-foreground" : "text-foreground")}>{f.name}</span>
                          <Badge variant="outline" className={cn(
                            "text-[7px] font-bold uppercase tracking-tighter py-0 px-1 border-primary/20",
                            session.frameworkId === f.id ? "bg-white/20 text-white border-white/20" : "text-primary/70"
                          )}>{f.category}</Badge>
                        </div>
                        {session.frameworkId === f.id && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <p className={cn("text-[10px] leading-relaxed line-clamp-2", session.frameworkId === f.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{f.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {f.tags?.slice(0, 3).map(t => (
                          <span key={t} className={cn(
                            "px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-tighter",
                            session.frameworkId === f.id ? "bg-white/10 border-white/10 text-white" : "bg-background border-border text-muted-foreground"
                          )}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Personas Tab */}
              <TabsContent value="personas" className="mt-0 space-y-6 outline-none">
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle size={14} className="text-primary" />
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cognitive Identities</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {personas.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => applyPersona(session.id, p.id)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all relative overflow-hidden",
                        session.personaId === p.id 
                          ? "bg-accent border-accent text-accent-foreground shadow-xl shadow-accent/20 scale-95" 
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-card hover:border-border"
                      )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                        session.personaId === p.id ? "bg-white/20" : "bg-card shadow-sm border border-border"
                      )}>
                        <Zap size={20} className={session.personaId === p.id ? "text-white" : "text-primary"} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest block">{p.name}</span>
                        <span className={cn(
                          "text-[7px] font-bold uppercase tracking-tighter mt-1 block",
                          session.personaId === p.id ? "text-accent-foreground/60" : "text-muted-foreground/60"
                        )}>{p.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* Linguistic Controls Tab */}
              <TabsContent value="linguistic" className="mt-0 space-y-8 outline-none">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Type size={14} className="text-primary" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linguistic Presets</Label>
                  </div>
                  <div className="grid gap-2">
                    {linguisticControls.map(lc => (
                      <button 
                        key={lc.id} 
                        onClick={() => applyLinguisticControl(session.id, lc.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-[1.5rem] border transition-all text-left",
                          session.linguisticId === lc.id 
                            ? "bg-destructive text-destructive-foreground border-destructive shadow-lg" 
                            : "bg-muted/30 border-border hover:bg-card"
                        )}
                      >
                        <div>
                          <div className={cn("text-[11px] font-bold", session.linguisticId === lc.id ? "text-destructive-foreground" : "text-foreground")}>{lc.name}</div>
                          <div className={cn("text-[9px] uppercase tracking-widest mt-1", session.linguisticId === lc.id ? "text-destructive-foreground/70" : "text-muted-foreground")}>{lc.category} • {lc.description}</div>
                        </div>
                        {session.linguisticId === lc.id && <Check size={12} className="text-destructive-foreground" />}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border opacity-50" />

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={14} className="text-primary" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Precision Fine-Tuning</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground">Creativity Engine (Temperature)</Label>
                      <span className="text-[10px] font-code font-bold text-primary">{session.settings.temperature}</span>
                    </div>
                    <Slider
                      value={[session.settings.temperature]}
                      min={0}
                      max={2}
                      step={0.05}
                      onValueChange={([val]) => updateSessionSettings(session.id, { temperature: val })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground">Response Depth (Max Tokens)</Label>
                      <span className="text-[10px] font-code font-bold text-primary">{session.settings.maxTokens}</span>
                    </div>
                    <Slider
                      value={[session.settings.maxTokens]}
                      min={128}
                      max={4096}
                      step={128}
                      onValueChange={([val]) => updateSessionSettings(session.id, { maxTokens: val })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cognitive Memory Type</Label>
                    <Select
                      value={session.settings.memoryType}
                      onValueChange={(val: any) => updateSessionSettings(session.id, { memoryType: val })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border bg-muted/30 text-xs font-bold px-5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border shadow-2xl">
                        <SelectItem value="buffer" className="rounded-xl text-xs font-bold py-3">Active Buffer (Short-term)</SelectItem>
                        <SelectItem value="summary" className="rounded-xl text-xs font-bold py-3">Recursive Summary</SelectItem>
                        <SelectItem value="knowledge-graph" className="rounded-xl text-xs font-bold py-3">Knowledge Graph (RAG)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
