
"use client";

import { useAppStore } from "@/store/use-app-store";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function ParameterControls() {
  const { activeSessionId, sessions, updateSessionSettings } = useAppStore();
  const session = sessions.find(s => s.id === activeSessionId);

  if (!session) return null;

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
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top P</Label>
          <span className="text-xs font-mono text-accent">{session.settings.topP}</span>
        </div>
        <Slider
          value={[session.settings.topP]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={([val]) => updateSessionSettings(session.id, { topP: val })}
        />
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
