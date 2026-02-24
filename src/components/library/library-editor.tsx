"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import { Persona, Framework, LinguisticControl } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Save, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryEditorProps {
  children: React.ReactNode;
  mode: 'create' | 'edit';
  type: 'persona' | 'framework' | 'linguistic';
  item?: any;
}

export function LibraryEditor({ children, mode, type, item }: LibraryEditorProps) {
  const { 
    addPersona, 
    updatePersona, 
    addFramework, 
    updateFramework, 
    addLinguisticControl, 
    updateLinguisticControl 
  } = useAppStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    category: "Custom"
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          name: mode === 'create' && !item.isCustom ? `Copy of ${item.name}` : item.name,
          description: item.description || "",
          content: item.system_prompt || item.content || item.system_instruction || "",
          category: item.category || "Custom"
        });
      } else {
        setFormData({
          name: "",
          description: "",
          content: "",
          category: "Custom"
        });
      }
    }
  }, [isOpen, item, mode]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Protocol identifier and core logic are required nodes."
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
      if (mode === 'create' || !item?.id) addPersona(data as Persona);
      else updatePersona(item.id, data);
    } else if (type === 'framework') {
      const data: Partial<Framework> = {
        name: formData.name,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        isCustom: true
      };
      if (mode === 'create' || !item?.id) addFramework(data as Framework);
      else updateFramework(item.id, data);
    } else if (type === 'linguistic') {
      const data: Partial<LinguisticControl> = {
        name: formData.name,
        description: formData.description,
        system_instruction: formData.content,
        category: formData.category,
        isCustom: true
      };
      if (mode === 'create' || !item?.id) addLinguisticControl(data as LinguisticControl);
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

  const dialogTitle = mode === 'create' && item 
    ? `Clone & Refine ${labels[type].title}` 
    : mode === 'create' 
      ? `Initialize ${labels[type].title}` 
      : `Refine ${labels[type].title}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-xl w-[95vw] sm:w-full border-white/20 bg-white/95 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[3rem] p-0 overflow-hidden outline-none gap-0 border flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 border-b border-slate-100 bg-white/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
              <Zap size={20} />
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="font-headline text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                {dialogTitle}
              </DialogTitle>
              <DialogDescription className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                Configure your custom neural protocol and system instructions. Node will be persisted locally.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Protocol Identifier</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Tactical Strategist"
                className="rounded-xl border-slate-100 bg-slate-50 h-10 text-xs font-bold focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Category Cluster</Label>
              <Input 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Custom"
                className="rounded-xl border-slate-100 bg-slate-50 h-10 text-xs font-bold focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Descriptive Telemetry</Label>
            <Input 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief overview of protocol behavior..."
              className="rounded-xl border-slate-100 bg-slate-50 h-10 text-xs font-medium focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{labels[type].content}</Label>
            <Textarea 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Enter core system instructions and behavioral constraints..."
              className="rounded-2xl border-slate-100 bg-slate-50 min-h-[200px] font-mono text-xs leading-relaxed p-4 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 shrink-0 flex flex-row items-center justify-between sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle size={14} className="shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-wider italic leading-none hidden sm:inline">Local Node Persisted</span>
          </div>
          <Button 
            onClick={handleSave}
            className="h-11 px-8 flex-1 sm:flex-none rounded-xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-primary/20 gap-2"
          >
            <Save size={14} />
            Commit Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
