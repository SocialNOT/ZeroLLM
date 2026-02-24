
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
  FolderOpen,
  Sparkles,
  ArrowRight,
  Target,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Accordion, 
  AccordionItem, 
  AccordionContent, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { LibraryEditor } from "@/components/library/library-editor";

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

  const groupedFrameworks = useMemo(() => {
    return frameworks.reduce((acc, f) => {
      const cat = f.isCustom ? 'Custom Protocols' : f.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(f);
      return acc;
    }, {} as Record<string, typeof frameworks>);
  }, [frameworks]);

  const groupedPersonas = useMemo(() => {
    return personas.reduce((acc, p) => {
      const cat = p.isCustom ? 'Custom Identities' : p.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {} as Record<string, typeof personas>);
  }, [personas]);

  const groupedLinguistic = useMemo(() => {
    return linguisticControls.reduce((acc, l) => {
      const cat = l.isCustom ? 'Custom Logic' : l.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(l);
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-primary" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Architectural Protocols</Label>
                  </div>
                  <LibraryEditor mode="create" type="framework">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/5">
                      <Zap size={14} />
                    </Button>
                  </LibraryEditor>
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
                        <div className="grid gap-3 pl-4 border-l-2 border-primary/10 ml-3 py-2">
                          {items.map(f => (
                            <div 
                              key={f.id} 
                              className={cn(
                                "p-5 rounded-2xl border transition-all group relative overflow-hidden",
                                session.frameworkId === f.id 
                                  ? "bg-primary text-primary-foreground border-primary shadow-lg" 
                                  : "bg-white border-border hover:border-primary/20"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[12px] font-bold">{f.name}</span>
                                <div className="flex items-center gap-2">
                                  <LibraryEditor mode={f.isCustom ? "edit" : "create"} type="framework" item={f}>
                                    <button 
                                      className={cn("p-1 rounded hover:bg-white/20 transition-colors", session.frameworkId === f.id ? "text-white" : "text-slate-400")}
                                      title={f.isCustom ? "Edit Custom Protocol" : "Modify & Clone Protocol"}
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                  </LibraryEditor>
                                  {session.frameworkId === f.id && <Badge variant="outline" className="text-[8px] uppercase bg-white/20 border-white/30 text-white">Active</Badge>}
                                </div>
                              </div>
                              <p className={cn("text-[10px] leading-relaxed mb-3", session.frameworkId === f.id ? "text-white/80" : "text-muted-foreground")}>{f.description}</p>
                              
                              <div className="space-y-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => applyFramework(session.id, f.id)}
                                  className={cn(
                                    "w-full h-8 rounded-xl text-[9px] font-bold uppercase tracking-widest gap-2",
                                    session.frameworkId === f.id 
                                      ? "bg-white text-primary hover:bg-white/90" 
                                      : "bg-primary text-white hover:bg-primary/90"
                                  )}
                                >
                                  {session.frameworkId === f.id ? <Check size={12} /> : <Zap size={12} />}
                                  {session.frameworkId === f.id ? "Energized" : "Activate Protocol"}
                                </Button>
                              </div>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserCircle size={14} className="text-primary" />
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cognitive Identities</Label>
                  </div>
                  <LibraryEditor mode="create" type="persona">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/5">
                      <Zap size={14} />
                    </Button>
                  </LibraryEditor>
                </div>

                <Accordion type="single" collapsible className="w-full space-y-2">
                  {Object.entries(groupedPersonas).map(([category, items]) => (
                    <AccordionItem key={category} value={category} className="border-none">
                      <AccordionTrigger className="flex px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all hover:no-underline border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Sparkles size={12} className="text-accent" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">{category}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-0">
                        <div className="grid gap-3 pl-4 border-l-2 border-accent/10 ml-3 py-2">
                          {items.map(p => (
                            <div 
                              key={p.id} 
                              className={cn(
                                "p-5 rounded-2xl border transition-all group relative overflow-hidden",
                                session.personaId === p.id 
                                  ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/10" 
                                  : "bg-white border-border hover:border-accent/20"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", session.personaId === p.id ? "bg-white/20" : "bg-accent/5")}>
                                    <UserCircle size={12} className={session.personaId === p.id ? "text-white" : "text-accent"} />
                                  </div>
                                  <span className="text-[12px] font-bold">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <LibraryEditor mode={p.isCustom ? "edit" : "create"} type="persona" item={p}>
                                    <button 
                                      className={cn("p-1 rounded hover:bg-white/20 transition-colors", session.personaId === p.id ? "text-white" : "text-slate-400")}
                                      title={p.isCustom ? "Edit Custom Identity" : "Modify & Clone Identity"}
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                  </LibraryEditor>
                                  {session.personaId === p.id && <Badge variant="outline" className="text-[8px] uppercase bg-white/20 border-white/30 text-white">Active</Badge>}
                                </div>
                              </div>
                              <p className={cn("text-[10px] leading-relaxed mb-3", session.personaId === p.id ? "text-white/80" : "text-muted-foreground")}>{p.description}</p>
                              
                              <div className="space-y-4">
                                <Button 
                                  size="sm" 
                                  onClick={() => applyPersona(session.id, p.id)}
                                  className={cn(
                                    "w-full h-8 rounded-xl text-[9px] font-bold uppercase tracking-widest gap-2",
                                    session.personaId === p.id 
                                      ? "bg-white text-accent hover:bg-white/90" 
                                      : "bg-accent text-white hover:bg-accent/90"
                                  )}
                                >
                                  {session.personaId === p.id ? <Check size={12} /> : <Zap size={12} />}
                                  {session.personaId === p.id ? "Identity Linked" : "Energize Identity"}
                                </Button>
                              </div>
                            </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Type size={14} className="text-primary" />
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linguistic Presets</Label>
                    </div>
                    <LibraryEditor mode="create" type="linguistic">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/5">
                        <Zap size={14} />
                      </Button>
                    </LibraryEditor>
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
                          <div className="grid gap-3 pl-4 border-l-2 border-rose-500/10 ml-3 py-2">
                            {items.map(lc => (
                              <div 
                                key={lc.id} 
                                className={cn(
                                  "p-5 rounded-2xl border transition-all group relative overflow-hidden",
                                  session.linguisticId === lc.id 
                                    ? "bg-destructive text-destructive-foreground border-destructive shadow-lg shadow-destructive/10" 
                                    : "bg-white border-border hover:border-destructive/20"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[12px] font-bold uppercase tracking-widest">{lc.name}</span>
                                  <div className="flex items-center gap-2">
                                    <LibraryEditor mode={lc.isCustom ? "edit" : "create"} type="linguistic" item={lc}>
                                      <button 
                                        className={cn("p-1 rounded hover:bg-white/20 transition-colors", session.linguisticId === lc.id ? "text-white" : "text-slate-400")}
                                        title={lc.isCustom ? "Edit Custom logic" : "Modify & Clone Logic"}
                                      >
                                        <Edit3 size={12} />
                                      </button>
                                    </LibraryEditor>
                                    {session.linguisticId === lc.id && <Badge variant="outline" className="text-[8px] uppercase bg-white/20 border-white/30 text-white">Active</Badge>}
                                  </div>
                                </div>
                                <p className={cn("text-[10px] leading-relaxed mb-3", session.linguisticId === lc.id ? "text-white/80" : "text-muted-foreground")}>{lc.description}</p>
                                
                                <div className="space-y-4">
                                  <Button 
                                    size="sm" 
                                    onClick={() => applyLinguisticControl(session.id, lc.id)}
                                    className={cn(
                                      "w-full h-8 rounded-xl text-[9px] font-bold uppercase tracking-widest gap-2",
                                      session.linguisticId === lc.id 
                                        ? "bg-white text-destructive hover:bg-white/90" 
                                        : "bg-destructive text-white hover:bg-destructive/90"
                                    )}
                                  >
                                    {session.linguisticId === lc.id ? <Check size={12} /> : <ArrowRight size={12} />}
                                    {session.linguisticId === lc.id ? "Logic Active" : "Activate Logic"}
                                  </Button>
                                </div>
                              </div>
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
                    <div className="relative">
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
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
