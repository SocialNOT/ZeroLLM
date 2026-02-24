
"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { Persona, Framework, LinguisticControl } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Save, Zap, AlertCircle } from "lucide-react";

interface LibraryEditorProps {
  children: React.ReactNode;
  mode: 'create' | 'edit';
  type: 'persona' | 'framework' | 'linguistic';
  item?: any;
}

export function LibraryEditor({ children, mode, type, item }: LibraryEditorProps) {
  const { addPersona, updatePersona, addFramework, updateFramework, addLinguisticControl, updateLinguisticControl } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    content: item?.system_prompt || item?.content || item?.system_instruction || "",
    category: item?.category || "Custom"
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        content: item.system_prompt || item.content || item.system_instruction || "",
        category: item.category || "Custom"
      });
    }
  }, [item]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Protocol name and core logic are required nodes."
      });
      return;
    }

    if (type === 'persona') {
      const data: Partial<Persona> = {
        name: formData.name,
        description: formData.description,
        system_prompt: formData.content,
        category: formData.category,
        isCustom: true
      };
      if (mode === 'create') addPersona(data as Persona);
      else updatePersona(item.id, data);
    } else if (type === 'framework') {
      const data: Partial<Framework> = {
        name: formData.name,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        isCustom: true
      };
      if (mode === 'create') addFramework(data as Framework);
      else updateFramework(item.id, data);
    } else {
      const data: Partial<LinguisticControl> = {
        name: formData.name,
        description: formData.description,
        system_instruction: formData.content,
        category: formData.category,
        isCustom: true
      };
      if (mode === 'create') addLinguisticControl(data as LinguisticControl);
      else updateLinguisticControl(item.id, data);
    }

    toast({
      title: "Library Node Synchronized",
      description: `${formData.name} has been persisted to your local node.`
    });
    setIsOpen(false);
  };

  const labels = {
    persona: { title: "Cognitive Identity", content: "System Prompt" },
    framework: { title: "Architectural Protocol", content: "Framework Logic" },
    linguistic: { title: "Linguistic Controller", content: "Instruction Set" }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-xl w-[95vw] rounded-[2.5rem] border border-slate-100 bg-white shadow-3xl overflow-hidden p-0">
        <DialogHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Zap size={20} />
            </div>
            <div>
              <DialogTitle className="font-headline text-xl font-bold text-slate-900 tracking-tight">
                {mode === 'create' ? `Initialize ${labels[type].title}` : `Refine ${labels[type].title}`}
              </DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Configure your custom neural protocol.</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Protocol Identifier</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Tactical Strategist"
                className="rounded-xl border-slate-100 bg-slate-50 h-11 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Category Cluster</Label>
              <Input 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Custom"
                className="rounded-xl border-slate-100 bg-slate-50 h-11 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Descriptive Telemetry</Label>
            <Input 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief overview of protocol behavior..."
              className="rounded-xl border-slate-100 bg-slate-50 h-11 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{labels[type].content}</Label>
            <Textarea 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Enter core system instructions and behavioral constraints..."
              className="rounded-2xl border-slate-100 bg-slate-50 min-h-[200px] font-mono text-sm leading-relaxed p-4 focus:ring-primary/20"
            />
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle size={14} />
            <span className="text-[9px] font-bold uppercase tracking-wider italic">Node will be persisted locally</span>
          </div>
          <Button 
            onClick={handleSave}
            className="h-11 px-8 rounded-xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-primary/20 gap-2"
          >
            <Save size={14} />
            Commit Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
