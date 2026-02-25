
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
  Sparkles
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
        content: `[TRANSLATION: ${lang}]\n\n${translatedText}`,
        timestamp: Date.now()
      };
      
      addMessage(activeSessionId, translationMsg);
      toast({ title: "Neural Translation Synchronized" });
    } catch (error) {
      toast({ variant: "destructive", title: "Translation Error" });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={cn(
      "group flex w-full mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex max-w-[98%] sm:max-w-[92%] lg:max-w-[90%] gap-3 sm:gap-4",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <div className="flex-shrink-0 pt-1">
          <div className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shadow-lg border-2 transition-transform group-hover:scale-105",
            isAssistant 
              ? isError ? "bg-rose-600 text-white border-rose-700" : "bg-primary text-white border-primary" 
              : "bg-accent text-white border-accent"
          )}>
            {isAssistant ? <Bot size={18} /> : <User size={18} />}
          </div>
        </div>

        <div className={cn(
          "flex flex-col gap-1.5",
          isAssistant ? "items-start" : "items-end"
        )}>
          <div className="flex items-center gap-3 px-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.1em]",
              isError ? "text-rose-700" : "text-primary"
            )}>
              {isAssistant ? isError ? "Node Critical Error" : "Neural Command Node" : "Human Core Identity"}
            </span>
            {message.content.includes("[TRANSLATION:") && (
              <Badge variant="outline" className="text-[9px] font-black uppercase py-0 px-2 border-emerald-700 bg-emerald-50 text-emerald-700">
                Linguistic Protocol
              </Badge>
            )}
          </div>

          <div className={cn(
            "p-4 sm:p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden",
            isAssistant 
              ? isError 
                ? "bg-rose-50 border-2 border-rose-600 text-rose-950 rounded-tl-none" 
                : "bg-white border-2 border-border text-slate-950 rounded-tl-none" 
              : "bg-primary text-white rounded-tr-none border-2 border-black/5"
          )}>
            <div className={cn(
              "text-[15px] sm:text-[16px] leading-relaxed relative z-10 font-bold",
              isError && "font-mono text-[12px] text-rose-900"
            )}>
              {isAssistant && !isError ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({...props}) => <p className="mb-3 last:mb-0" {...props} />,
                    h1: ({...props}) => <h1 className="text-xl font-black mb-3 mt-4 first:mt-0 text-primary" {...props} />,
                    h2: ({...props}) => <h2 className="text-lg font-black mb-3 mt-3 first:mt-0 text-primary" {...props} />,
                    h3: ({...props}) => <h3 className="text-md font-black mb-2 mt-3 first:mt-0 text-primary" {...props} />,
                    ul: ({...props}) => <ul className="list-disc pl-6 mb-3 space-y-1.5" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal pl-6 mb-3 space-y-1.5" {...props} />,
                    li: ({...props}) => <li className="marker:text-primary font-black" {...props} />,
                    strong: ({...props}) => <strong className="font-black text-primary" {...props} />,
                    code: ({node, inline, className, children, ...props}: any) => {
                      if (inline) return <code className="bg-slate-100 px-2 py-0.5 rounded text-[13px] font-mono text-primary font-black border-2 border-primary/10" {...props}>{children}</code>;
                      return (
                        <div className="my-4 rounded-xl border-2 border-primary/20 bg-slate-950 p-4 overflow-x-auto custom-scrollbar shadow-inner">
                          <code className="text-[13px] font-mono text-slate-100 leading-normal block" {...props}>{children}</code>
                        </div>
                      );
                    },
                    blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-5 italic my-3 text-slate-950 font-black" {...props} />,
                    table: ({...props}) => <div className="overflow-x-auto my-4 rounded-xl border-2 border-border"><table className="w-full text-left border-collapse" {...props} /></div>,
                    th: ({...props}) => <th className="bg-slate-50 p-3 border-b-2 border-border font-black text-[13px] uppercase tracking-wider text-slate-950" {...props} />,
                    td: ({...props}) => <td className="p-3 border-b border-border text-[14px] text-slate-950 font-black" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
            {isAssistant && !isError && (
              <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                <Sparkles size={40} className="text-primary" />
              </div>
            )}
          </div>

          <div className={cn(
            "flex items-center gap-2 mt-1 transition-all duration-300",
            !isAssistant && "flex-row-reverse"
          )}>
            {isAssistant && !isError && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" onClick={handleSpeech}>
                  {isPlaying ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" onClick={onRegenerate}>
                  <RefreshCw size={14} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20">
                      {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={14} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isAssistant ? "start" : "end"} className="rounded-2xl p-1 shadow-2xl border-2 border-border bg-white min-w-[140px]">
                    {['Hindi', 'Bengali', 'Spanish', 'French', 'Japanese', 'German'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => handleTranslate(l)} className="text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-2.5 cursor-pointer text-primary hover:bg-primary hover:text-white transition-all">
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" onClick={handleCopy}>
              {isCopied ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
            </Button>
            <div className="flex items-center justify-center bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
              <span className="text-[9px] font-black font-mono text-primary leading-none">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
