"use client";

import { useAppStore } from "@/store/use-app-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Wrench, Database } from "lucide-react";

export function ParameterControls() {
  const { activeSessionId, sessions, updateSessionSettings, availableTools } = useAppStore();
  const session = sessions.find(s => s.id === activeSessionId);

  if (!session) return null;

  const enabledTools = session.settings?.enabledTools || [];

  const toggleTool = (toolId: string) => {
    const newTools = enabledTools.includes(toolId)
      ? enabledTools.filter(id => id !== toolId)
      : [...enabledTools, toolId];
    updateSessionSettings(session.id, { enabledTools: newTools });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temperature</Label>
          <span className="text-xs font-mono text-accent">{session.settings.temperature}</span>
        </div>
        <Slider
          value={[session.settings.temperature]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={([val]) => updateSessionSettings(session.id, { temperature: val })}
        />
        <p className="text-[10px] text-muted-foreground leading-tight">Controls randomness. Lower is more predictable.</p>
      </div>

      <Separator className="bg-white/5" />

      <div className="space-y-4">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Database size={12} />
          Memory Type
        </Label>
        <Select
          value={session.settings.memoryType}
          onValueChange={(val: any) => updateSessionSettings(session.id, { memoryType: val })}
        >
          <SelectTrigger className="h-9 border-white/10 bg-white/5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buffer">Conversation Buffer</SelectItem>
            <SelectItem value="summary">Conversation Summary</SelectItem>
            <SelectItem value="knowledge-graph">Knowledge Graph (KG)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground italic">Summary memory optimizes long context windows.</p>
      </div>

      <Separator className="bg-white/5" />

      <div className="space-y-4">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Wrench size={12} />
          Plugin Tools
        </Label>
        <div className="space-y-3">
          {availableTools.map(tool => (
            <div key={tool.id} className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="flex flex-col">
                <span className="text-xs font-bold">{tool.name}</span>
                <span className="text-[9px] text-muted-foreground">{tool.description}</span>
              </div>
              <Switch 
                checked={enabledTools.includes(tool.id)}
                onCheckedChange={() => toggleTool(tool.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-white/5" />

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output Format</Label>
        <Select
          value={session.settings.format}
          onValueChange={(val: any) => updateSessionSettings(session.id, { format: val })}
        >
          <SelectTrigger className="h-9 border-white/10 bg-white/5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="markdown">Markdown Standard</SelectItem>
            <SelectItem value="json">Structured JSON</SelectItem>
            <SelectItem value="step-by-step">Step-by-Step Logic</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}