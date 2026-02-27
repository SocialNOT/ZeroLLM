"use client";

import React, { useState } from "react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { 
  Copy, 
  User, 
  Bot, 
  RefreshCw, 
  Languages, 
  Volume2,
  Check,
  Loader2,
  Terminal,
  AlertTriangle,
  Sparkles,
  Search,
  Brain,
  Expand,
  Zap,
  Microscope,
  ShieldCheck,
  Activity,
  LineChart,
  Clock,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/use-app-store";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
import { translateText } from "@/ai/flows/translate-flow";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isError = isAssistant && (message.content.includes("ERROR:") || message.content.includes("FAILURE:"));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const { addMessage, activeSessionId } = useAppStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    toast({ title: "Copied to clipboard", duration: 1000 });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSpeech = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const { audioUri } = await generateSpeech({ text: message.content });
      const audio = new Audio(audioUri);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (error) {
      toast({ variant: "destructive", title: "Audio Error" });
      setIsPlaying(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    if (!activeSessionId) return;
    setIsTranslating(true);
    try {
      const { translatedText } = await translateText({ text: message.content, targetLanguage: lang });
      const translationMsg = {
        id: `trans-${Date.now()}`,
        role: "assistant" as const,
        content: `[TRANSLATION: ${lang.toUpperCase()}]\n\n${translatedText}`,
        timestamp: Date.now()
      };
      addMessage(activeSessionId, translationMsg);
      toast({ title: "Translation Synchronized" });
    } catch (error) {
      toast({ variant: "destructive", title: "Translation Error" });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRefineNode = (type: string) => {
    toast({ title: `Energizing ${type} Node`, description: "Orchestrating targeted response refinement..." });
  };

  const operatorName = isAssistant 
    ? isError ? "NODE_CRITICAL_FAILURE" : "NEURAL_COMMAND_NODE" 
    : "HUMAN_CORE_IDENTITY";

  return (
    <div className={cn(
      "flex w-full mb-6 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-3 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex flex-col border-2 shadow-2xl transition-all bg-white overflow-hidden min-w-0",
        isAssistant 
          ? isError 
            ? "max-w-full border-rose-600 shadow-rose-200/50" 
            : "max-w-[95%] sm:max-w-[85%] border-primary shadow-primary/10 mr-auto" 
          : "max-w-[90%] sm:max-w-[80%] border-slate-900 shadow-slate-200/50 w-fit ml-auto"
      )}>
        {/* Monolithic Terminal Header */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 border-b-2 font-mono text-[10px] font-black uppercase tracking-widest select-none overflow-hidden shrink-0",
          isAssistant 
            ? isError ? "bg-rose-600 text-white border-rose-700" : "bg-primary text-white border-primary"
            : "bg-slate-900 text-white border-slate-900"
        )}>
          <div className="flex h-5 w-5 items-center justify-center rounded bg-white/30 shrink-0">
            {isAssistant ? isError ? <AlertTriangle size={12} /> : <Bot size={12} /> : <User size={12} />}
          </div>
          <span className="truncate flex-1 font-black leading-none">{operatorName}.MD</span>
          <div className="flex items-center gap-2 shrink-0 ml-auto pl-2">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_5px_white]" />
          </div>
        </div>

        {/* Message Body */}
        <div className="p-4 sm:p-6 relative overflow-hidden min-w-0">
          <div className={cn(
            "text-[13px] sm:text-[15px] leading-relaxed font-bold break-words whitespace-pre-wrap text-slate-900",
            isError && "break-all font-mono text-[11px] text-rose-600"
          )}>
            {isAssistant && !isError ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({...props}) => <p className="mb-4 last:mb-0" {...props} />,
                  h1: ({...props}) => <h1 className="text-xl font-black mb-4 mt-6 first:mt-0 text-primary border-b-2 border-primary/20 pb-1 uppercase tracking-tight" {...props} />,
                  h2: ({...props}) => <h2 className="text-lg font-black mb-3 mt-5 first:mt-0 text-primary uppercase" {...props} />,
                  ul: ({...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                  li: ({...props}) => <li className="marker:text-primary marker:font-black pl-1" {...props} />,
                  strong: ({...props}) => <strong className="font-black text-primary bg-primary/5 px-1 rounded" {...props} />,
                  code: ({node, inline, children, ...props}: any) => {
                    if (inline) return <code className="bg-primary/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-black border-2 border-primary/20 break-all" {...props}>{children}</code>;
                    return (
                      <div className="my-4 rounded-xl border-2 border-primary/30 bg-slate-950 p-4 overflow-x-auto custom-scrollbar shadow-xl min-w-0">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-white/20">
                          <span className="text-[10px] font-mono text-white font-black uppercase tracking-widest">Neural Code Node</span>
                          <Terminal size={12} className="text-white" />
                        </div>
                        <code className="text-[12px] font-mono text-slate-100 leading-tight block font-medium" {...props}>{children}</code>
                      </div>
                    );
                  },
                  blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-4 py-2 italic my-4 text-slate-900 bg-primary/10 rounded-r-xl font-black shadow-sm" {...props} />,
                  table: ({...props}) => <div className="overflow-x-auto my-5 rounded-xl border-2 border-primary/20 shadow-lg min-w-0 w-full"><table className="w-full text-left border-collapse" {...props} /></div>,
                  th: ({...props}) => <th className="bg-primary/10 p-3 border-b-2 border-primary/20 font-black text-[11px] uppercase tracking-wider text-primary" {...props} />,
                  td: ({...props}) => <td className="p-3 border-b border-primary/10 text-[12px] text-slate-900 font-bold" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="font-black">{message.content}</div>
            )}
          </div>
          
          {isAssistant && !isError && (
            <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
              <Sparkles size={48} className="text-primary" />
            </div>
          )}
        </div>

        {/* COLLAPSIBLE HANDLE FOR MESSAGE TOOLS */}
        {isAssistant && !isError && (
          <button 
            type="button"
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            className="w-full h-4 bg-slate-50 border-t-2 border-slate-100 hover:bg-slate-100 transition-colors flex items-center justify-center group cursor-pointer"
            title={isToolsExpanded ? "Collapse Node Tools" : "Expand Node Tools"}
          >
            <div className={cn("transition-transform duration-300", !isToolsExpanded && "rotate-180")}>
              <ChevronUp size={14} className={cn("transition-colors", isToolsExpanded ? "text-primary" : "text-slate-400 group-hover:text-primary")} />
            </div>
          </button>
        )}

        {/* High-Fidelity 6x2 Interaction Grid (Two Rows) */}
        <div className={cn(
          "grid grid-cols-6 divide-x-2 divide-slate-100 border-t-2 border-slate-100 bg-slate-50 transition-all overflow-hidden",
          isAssistant && !isError && !isToolsExpanded && "h-0 border-t-0"
        )}>
          {isAssistant && !isError ? (
            <>
              {[
                { id: 'voice', icon: <Volume2 size={12} />, title: 'Voice', action: handleSpeech },
                { id: 'regen', icon: <RefreshCw size={12} />, title: 'Regen', action: onRegenerate },
                { id: 'think', icon: <Brain size={12} />, title: 'Deep Dive', action: () => handleRefineNode('Thinking') },
                { id: 'verify', icon: <Search size={12} />, title: 'Fact Check', action: () => handleRefineNode('Verification') },
                { id: 'academic', icon: <Microscope size={12} />, title: 'Research', action: () => handleRefineNode('Academic') },
                { id: 'optimize', icon: <Zap size={12} />, title: 'Optimize', action: () => handleRefineNode('Performance') },
                { id: 'explain', icon: <Activity size={12} />, title: 'Explain', action: () => handleRefineNode('Cognitive') },
                { id: 'audit', icon: <ShieldCheck size={12} />, title: 'Security', action: () => handleRefineNode('Safety') },
                { id: 'logic', icon: <LineChart size={12} />, title: 'Logic Trace', action: () => handleRefineNode('Logical') },
                { id: 'translate', icon: <Languages size={12} />, title: 'Translate', action: () => handleRefineNode('Linguistic') },
                { id: 'copy', icon: <Copy size={12} />, title: 'Copy Node', action: handleCopy },
              ].map((btn, idx) => (
                <button 
                  key={btn.id}
                  onClick={btn.action}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 hover:bg-primary/5 transition-colors group",
                    idx < 6 && "border-b-2 border-slate-100"
                  )}
                >
                  <div className="text-primary group-hover:scale-110 transition-transform mb-0.5">{btn.icon}</div>
                  <span className="text-[6px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary">{btn.title}</span>
                </button>
              ))}
              <div className="flex flex-col items-center justify-center py-2 bg-primary text-white">
                <Clock size={12} className="mb-0.5" />
                <span className="text-[7px] font-black font-mono tracking-tighter">
                  {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            </>
          ) : (
            <button 
              onClick={handleCopy}
              className="col-span-6 flex items-center justify-center py-4 hover:bg-slate-100 transition-colors gap-3"
            >
              <Copy size={14} className="text-slate-900" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Synchronize Node Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
