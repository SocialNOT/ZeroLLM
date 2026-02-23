
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Wrench, 
  Database, 
  Layers, 
  UserCircle, 
  Type, 
  Plus, 
  Check, 
  Code, 
  Zap, 
  FlaskConical 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ParameterControls() {
  const { 
    activeSessionId, 
    sessions, 
    updateSessionSettings, 
    availableTools, 
    frameworks, 
    personas, 
    linguisticControls,
    applyFramework,
    applyPersona,
    applyLinguisticControl,
    addPersona,
    addFramework,
    addLinguisticControl
  } = useAppStore();

  const [isDeveloping, setIsDeveloping] = useState(false);
  const session = sessions.find(s => s.id === activeSessionId);

  if (!session) return null;

  const enabledTools = session.settings?.enabledTools || [];

  return (
    <div className="flex flex-col h-full bg-white">
      <Tabs defaultValue="frameworks" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-slate-50 p-1 rounded-none border-b border-slate-100">
          <TabsTrigger value="frameworks" className="text-[10px] font-bold uppercase tracking-widest gap-2">
            <Layers size={12} />
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="personas" className="text-[10px] font-bold uppercase tracking-widest gap-2">
            <UserCircle size={12} />
            Personas
          </TabsTrigger>
          <TabsTrigger value="linguistic" className="text-[10px] font-bold uppercase tracking-widest gap-2">
            <Type size={12} />
            Linguistic
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Frameworks Tab */}
          <TabsContent value="frameworks" className="mt-0 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prebuilt Protocols</Label>
              <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-widest text-primary gap-1" onClick={() => setIsDeveloping(!isDeveloping)}>
                <Plus size={10} /> {isDeveloping ? "Done" : "Develop New"}
              </Button>
            </div>

            <div className="grid gap-3">
              {frameworks.map(f => (
                <div 
                  key={f.id} 
                  onClick={() => applyFramework(session.id, f.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer group",
                    session.frameworkId === f.id 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-slate-50/50 border-slate-100 hover:border-primary/30 hover:bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">{f.name}</span>
                    {session.frameworkId === f.id && <Check size={12} className="text-primary" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{f.description}</p>
                  <div className="flex gap-1.5 mt-3">
                    {f.tools.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-white border border-slate-100 text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {isDeveloping && (
              <div className="mt-8 p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 animate-in slide-in-from-bottom-2 duration-300">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                  <FlaskConical size={14} />
                  Architect Framework
                </h4>
                <div className="space-y-4">
                  <Input placeholder="Framework Name" className="bg-white rounded-xl border-indigo-100 text-xs" />
                  <textarea placeholder="System Instructions..." className="w-full h-24 bg-white rounded-xl border border-indigo-100 p-3 text-xs focus:ring-1 focus:ring-indigo-400 outline-none" />
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Construct</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Personas Tab */}
          <TabsContent value="personas" className="mt-0 space-y-6">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-4">Identity Profiles</Label>
            <div className="grid grid-cols-2 gap-3">
              {personas.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => applyPersona(session.id, p.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all",
                    session.personaId === p.id 
                      ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-95" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                    session.personaId === p.id ? "bg-white/20" : "bg-white shadow-sm"
                  )}>
                    <Zap size={20} className={session.personaId === p.id ? "text-white" : "text-primary"} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">{p.name}</span>
                </button>
              ))}
            </div>
            
            <Button variant="outline" className="w-full mt-6 h-12 rounded-2xl border-dashed border-2 border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 transition-all text-[10px] font-bold uppercase tracking-[0.2em] gap-2">
              <Plus size={14} /> Design Persona
            </Button>
          </TabsContent>

          {/* Linguistic Controls Tab */}
          <TabsContent value="linguistic" className="mt-0 space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Linguistic Presets</Label>
              <div className="grid gap-2">
                {linguisticControls.map(lc => (
                  <button 
                    key={lc.id} 
                    onClick={() => applyLinguisticControl(session.id, lc.id)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                      session.settings.temperature === lc.temperature ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 hover:bg-white"
                    )}
                  >
                    <div>
                      <div className="text-[11px] font-bold text-slate-800">{lc.name}</div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">Temp: {lc.temperature} • {lc.format}</div>
                    </div>
                    {session.settings.temperature === lc.temperature && <Check size={12} className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-6">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fine Tuning</Label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-600">Creativity Engine</Label>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-600">Response Depth</Label>
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
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Structural Memory</Label>
                <Select
                  value={session.settings.memoryType}
                  onValueChange={(val: any) => updateSessionSettings(session.id, { memoryType: val })}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buffer">Active Buffer</SelectItem>
                    <SelectItem value="summary">Recursive Summary</SelectItem>
                    <SelectItem value="knowledge-graph">Knowledge Graph</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
