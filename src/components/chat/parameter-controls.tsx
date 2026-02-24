"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  UserCircle, 
  Type, 
  Check, 
  Zap, 
  Sliders,
  ChevronRight,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

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

  const session = sessions.find(s => s.id === activeSessionId);

  // Grouping logic for each category
  const groupedFrameworks = useMemo(() => {
    return frameworks.reduce((acc, f) => {
      if (!acc[f.category]) acc[f.category] = [];
      acc[f.category].push(f);
      return acc;
    }, {} as Record<string, typeof frameworks>);
  }, [frameworks]);

  const groupedPersonas = useMemo(() => {
    return personas.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, typeof personas>);
  }, [personas]);

  const groupedLinguistic = useMemo(() => {
    return linguisticControls.reduce((acc, l) => {
      if (!acc[l.category]) acc[l.category] = [];
      acc[l.category].push(l);
      return acc;
    }, {} as Record<string, typeof linguisticControls>);
  }, [linguisticControls]);

  if (!session) return null;

  return (
    <div className="flex flex-col h-full bg-card">
      <Tabs value={activeParameterTab} onValueChange={setActiveParameterTab} className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1.5 rounded-none border-b border-border h-12">
          <TabsTrigger value="frameworks" className="text-[9px] font-bold uppercase tracking-widest gap-2 data-[state=active]:bg-background">
            <Layers size={12} />
            Arch
          </TabsTrigger>
          <TabsTrigger value="personas" className="text-[9px] font-bold uppercase tracking-widest gap-2 data-[state=active]:bg-background">
            <UserCircle size={12} />
            ID
          </TabsTrigger>
          <TabsTrigger value="linguistic" className="text-[9px] font-bold uppercase tracking-widest gap-2 data-[state=active]:bg-background">
            <Type size={12} />
            Logic
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-8 pb-24">
              
              {/* Architectural Protocols (ARCH) */}
              <TabsContent value="frameworks" className="mt-0 space-y-6 outline-none">
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={14} className="text-primary" />
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Architectural Protocols</Label>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-2">
                  {Object.entries(groupedFrameworks).map(([category, items]) => (
                    <AccordionItem key={category} value={category} className="border-none">
                      <AccordionTrigger className="flex px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all hover:no-underline border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderOpen size={12} className="text-primary" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">{category}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-0">
                        <div className="grid gap-2 pl-4 border-l-2 border-primary/10 ml-3 py-2">
                          {items.map(f => (
                            <div 
                              key={f.id} 
                              onClick={() => applyFramework(session.id, f.id)}
                              className={cn(
                                "p-4 rounded-2xl border transition-all cursor-pointer group",
                                session.frameworkId === f.id 
                                  ? "bg-primary text-primary-foreground border-primary shadow-lg" 
                                  : "bg-white border-border hover:border-primary/20 hover:shadow-md"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn("text-[11px] font-bold", session.frameworkId === f.id ? "text-primary-foreground" : "text-foreground")}>{f.name}</span>
                                {session.frameworkId === f.id && <Check size={12} className="text-primary-foreground" />}
                              </div>
                              <p className={cn("text-[10px] leading-snug line-clamp-2 opacity-70", session.frameworkId === f.id ? "text-primary-foreground" : "text-muted-foreground")}>{f.description}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              {/* Cognitive Identities (ID) */}
              <TabsContent value="personas" className="mt-0 space-y-6 outline-none">
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle size={14} className="text-primary" />
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cognitive Identities</Label>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-2">
                  {Object.entries(groupedPersonas).map(([category, items]) => (
                    <AccordionItem key={category} value={category} className="border-none">
                      <AccordionTrigger className="flex px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all hover:no-underline border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Zap size={12} className="text-accent" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">{category}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-0">
                        <div className="grid grid-cols-2 gap-2 pl-4 border-l-2 border-accent/10 ml-3 py-2">
                          {items.map(p => (
                            <button 
                              key={p.id} 
                              onClick={() => applyPersona(session.id, p.id)}
                              className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center",
                                session.personaId === p.id 
                                  ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/10" 
                                  : "bg-white border-border text-muted-foreground hover:bg-card hover:shadow-md"
                              )}
                            >
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                session.personaId === p.id ? "bg-white/20" : "bg-muted/50 border border-border"
                              )}>
                                <Zap size={16} className={session.personaId === p.id ? "text-white" : "text-primary"} />
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest block line-clamp-1">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              {/* Linguistic Controls (LOGIC) */}
              <TabsContent value="linguistic" className="mt-0 space-y-8 outline-none">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Type size={14} className="text-primary" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linguistic Presets</Label>
                  </div>

                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {Object.entries(groupedLinguistic).map(([category, items]) => (
                      <AccordionItem key={category} value={category} className="border-none">
                        <AccordionTrigger className="flex px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all hover:no-underline border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-lg bg-rose-500/10 flex items-center justify-center">
                              <Type size={12} className="text-rose-500" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">{category}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-0">
                          <div className="grid gap-2 pl-4 border-l-2 border-rose-500/10 ml-3 py-2">
                            {items.map(lc => (
                              <button 
                                key={lc.id} 
                                onClick={() => applyLinguisticControl(session.id, lc.id)}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                  session.linguisticId === lc.id 
                                    ? "bg-destructive text-destructive-foreground border-destructive shadow-lg" 
                                    : "bg-white border-border hover:bg-card hover:shadow-md"
                                )}
                              >
                                <div className={cn("text-[10px] font-bold uppercase tracking-widest", session.linguisticId === lc.id ? "text-destructive-foreground" : "text-foreground")}>
                                  {lc.name}
                                </div>
                                {session.linguisticId === lc.id && <Check size={12} className="text-destructive-foreground" />}
                              </button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                <Separator className="bg-border/50" />

                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sliders size={14} className="text-primary" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Precision Controls</Label>
                  </div>
                  
                  <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Creativity (Temp)</Label>
                      <span className="text-[10px] font-mono font-bold text-primary">{session.settings.temperature}</span>
                    </div>
                    <Slider
                      value={[session.settings.temperature]}
                      min={0}
                      max={2}
                      step={0.05}
                      onValueChange={([val]) => updateSessionSettings(session.id, { temperature: val })}
                    />
                  </div>

                  <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Response Depth</Label>
                      <span className="text-[10px] font-mono font-bold text-primary">{session.settings.maxTokens}</span>
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
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Semantic Memory</Label>
                    <Select
                      value={session.settings.memoryType}
                      onValueChange={(val: any) => updateSessionSettings(session.id, { memoryType: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border bg-white text-[10px] font-bold uppercase px-4 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-2xl">
                        <SelectItem value="buffer" className="text-[10px] font-bold py-2 uppercase">Active Buffer</SelectItem>
                        <SelectItem value="summary" className="text-[10px] font-bold py-2 uppercase">Recursive Summary</SelectItem>
                        <SelectItem value="knowledge-graph" className="text-[10px] font-bold py-2 uppercase">Knowledge Graph</SelectItem>
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
