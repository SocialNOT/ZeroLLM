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
  Cpu,
  Sparkles,
  Terminal,
  AlertTriangle
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
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isError = isAssistant && message.content.includes("ERROR:");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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

  const operatorName = isAssistant 
    ? isError ? "NODE_CRITICAL_ERROR" : "NEURAL_COMMAND_NODE" 
    : "HUMAN_CORE_IDENTITY";

  return (
    <div className={cn(
      "flex w-full mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex flex-col max-w-[95%] sm:max-w-[80%] gap-0 rounded-2xl overflow-hidden border-2 shadow-2xl transition-all",
        isAssistant 
          ? isError 
            ? "border-rose-600 bg-rose-50 shadow-rose-200/50" 
            : "border-primary bg-white shadow-primary/10" 
          : "border-accent bg-primary text-white shadow-accent/20"
      )}>
        {/* Terminal Type Header */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 border-b-2 font-mono text-[10px] font-black uppercase tracking-widest select-none",
          isAssistant 
            ? isError ? "bg-rose-600 text-white border-rose-700" : "bg-primary text-white border-primary"
            : "bg-accent text-white border-accent"
        )}>
          <div className="flex h-5 w-5 items-center justify-center rounded bg-white/20">
            {isAssistant ? isError ? <AlertTriangle size={12} /> : <Bot size={12} /> : <User size={12} />}
          </div>
          <span className="truncate">{operatorName}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline opacity-60">.MD</span>
            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Message Content */}
        <div className="p-4 sm:p-5 relative">
          <div className={cn(
            "text-[13px] sm:text-[15px] leading-relaxed font-bold break-words whitespace-pre-wrap",
            isAssistant ? "text-slate-950" : "text-white"
          )}>
            {isAssistant && !isError ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({...props}) => <p className="mb-3 last:mb-0" {...props} />,
                  h1: ({...props}) => <h1 className="text-lg font-black mb-3 mt-4 first:mt-0 text-primary border-b-2 border-primary/10 pb-1" {...props} />,
                  h2: ({...props}) => <h2 className="text-md font-black mb-2 mt-3 first:mt-0 text-primary" {...props} />,
                  ul: ({...props}) => <ul className="list-disc pl-5 mb-3 space-y-1.5" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1.5" {...props} />,
                  li: ({...props}) => <li className="marker:text-primary marker:font-black" {...props} />,
                  strong: ({...props}) => <strong className="font-black text-primary" {...props} />,
                  code: ({node, inline, children, ...props}: any) => {
                    if (inline) return <code className="bg-primary/5 px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-black border border-primary/20" {...props}>{children}</code>;
                    return (
                      <div className="my-3 rounded-xl border-2 border-primary/20 bg-slate-950 p-4 overflow-x-auto custom-scrollbar shadow-inner group/code">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Code Node</span>
                          <Terminal size={10} className="text-white/40" />
                        </div>
                        <code className="text-[11px] font-mono text-slate-100 leading-tight block" {...props}>{children}</code>
                      </div>
                    );
                  },
                  blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-4 py-1 italic my-3 text-slate-900 bg-primary/5 rounded-r-lg font-black" {...props} />,
                  table: ({...props}) => <div className="overflow-x-auto my-4 rounded-xl border-2 border-primary/10 shadow-sm"><table className="w-full text-left border-collapse" {...props} /></div>,
                  th: ({...props}) => <th className="bg-primary/5 p-3 border-b-2 border-primary/10 font-black text-[11px] uppercase tracking-wider text-primary" {...props} />,
                  td: ({...props}) => <td className="p-3 border-b border-primary/5 text-[12px] text-slate-950 font-black" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="font-bold">{message.content}</div>
            )}
          </div>
          
          {isAssistant && !isError && (
            <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
              <Sparkles size={40} className="text-primary" />
            </div>
          )}
        </div>

        {/* Tactical Footer */}
        <div className={cn(
          "px-4 py-2 border-t flex items-center justify-between gap-3",
          isAssistant ? "bg-slate-50 border-primary/10" : "bg-white/10 border-white/10"
        )}>
          <div className="flex items-center gap-1">
            {isAssistant && !isError && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90" onClick={handleSpeech}>
                  {isPlaying ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90" onClick={onRegenerate}>
                  <RefreshCw size={14} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90">
                      {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={14} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl p-1 shadow-2xl border-2 border-primary/20 bg-white min-w-[140px] z-[100]">
                    <div className="px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-primary/40 border-b border-primary/5 mb-1">Target Node</div>
                    {['Hindi', 'Bengali', 'Spanish', 'French', 'Japanese', 'German'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => handleTranslate(l)} className="text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-2.5 cursor-pointer text-primary hover:bg-primary hover:text-white transition-colors">
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg transition-all active:scale-90", isAssistant ? "text-primary hover:bg-primary/10" : "text-white hover:bg-white/20")} onClick={handleCopy}>
              {isCopied ? <Check size={14} className={isAssistant ? "text-emerald-600" : "text-white"} /> : <Copy size={14} />}
            </Button>
          </div>

          <div className={cn(
            "flex items-center justify-center px-2 py-1 rounded-md border-2 font-mono text-[9px] font-black tracking-tighter leading-none shadow-sm",
            isAssistant 
              ? "bg-primary text-white border-primary shadow-primary/20" 
              : "bg-white text-primary border-white shadow-white/20"
          )}>
            {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        </div>
      </div>
    </div>
  );
}