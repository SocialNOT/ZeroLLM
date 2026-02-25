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
      toast({ title: "Translation Synchronized" });
    } catch (error) {
      toast({ variant: "destructive", title: "Translation Error" });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={cn(
      "group flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex max-w-[95%] sm:max-w-[85%] gap-2 sm:gap-3",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <div className="flex-shrink-0 pt-1">
          <div className={cn(
            "h-7 w-7 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shadow-md border-2 transition-transform",
            isAssistant 
              ? isError ? "bg-rose-600 text-white border-rose-700" : "bg-primary text-white border-primary" 
              : "bg-accent text-white border-accent"
          )}>
            {isAssistant ? <Bot size={16} /> : <User size={16} />}
          </div>
        </div>

        <div className={cn(
          "flex flex-col gap-1",
          isAssistant ? "items-start" : "items-end"
        )}>
          <div className="flex items-center gap-2 px-1">
            <span className={cn(
              "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em]",
              isError ? "text-rose-700" : "text-primary"
            )}>
              {isAssistant ? isError ? "Node Critical Error" : "Neural Command Node" : "Human Core Identity"}
            </span>
            {message.content.includes("[TRANSLATION:") && (
              <Badge variant="outline" className="text-[7px] font-black uppercase py-0 px-1 border-emerald-700 bg-emerald-100 text-emerald-900">
                Linguistic Node
              </Badge>
            )}
          </div>

          <div className={cn(
            "p-3 sm:p-4 rounded-xl shadow-md transition-all relative overflow-hidden",
            isAssistant 
              ? isError 
                ? "bg-rose-50 border-2 border-rose-600 text-rose-950 rounded-tl-none" 
                : "bg-white border-2 border-border text-slate-950 rounded-tl-none" 
              : "bg-primary text-primary-foreground rounded-tr-none border-2 border-black/10"
          )}>
            <div className={cn(
              "text-[13px] sm:text-[15px] leading-relaxed relative z-10 font-bold break-words",
              isError && "font-mono text-[11px] text-rose-900"
            )}>
              {isAssistant && !isError ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    h1: ({...props}) => <h1 className="text-lg font-black mb-2 mt-3 first:mt-0 text-primary" {...props} />,
                    h2: ({...props}) => <h2 className="text-md font-black mb-2 mt-2 first:mt-0 text-primary" {...props} />,
                    ul: ({...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                    li: ({...props}) => <li className="marker:text-primary font-black" {...props} />,
                    strong: ({...props}) => <strong className="font-black text-primary" {...props} />,
                    code: ({node, inline, children, ...props}: any) => {
                      if (inline) return <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-primary font-black border border-primary/10" {...props}>{children}</code>;
                      return (
                        <div className="my-2 rounded-lg border border-primary/20 bg-slate-950 p-3 overflow-x-auto no-scrollbar shadow-inner">
                          <code className="text-[11px] font-mono text-slate-100 leading-tight block" {...props}>{children}</code>
                        </div>
                      );
                    },
                    blockquote: ({...props}) => <blockquote className="border-l-4 border-primary pl-3 italic my-2 text-slate-950 font-black" {...props} />,
                    table: ({...props}) => <div className="overflow-x-auto my-2 rounded-lg border border-border"><table className="w-full text-left border-collapse" {...props} /></div>,
                    th: ({...props}) => <th className="bg-slate-50 p-2 border-b-2 border-border font-black text-[11px] uppercase tracking-wider text-slate-950" {...props} />,
                    td: ({...props}) => <td className="p-2 border-b border-border text-[12px] text-slate-950 font-black" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
            {isAssistant && !isError && (
              <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
                <Sparkles size={30} className="text-primary" />
              </div>
            )}
          </div>

          <div className={cn(
            "flex items-center gap-1.5 mt-1",
            !isAssistant && "flex-row-reverse"
          )}>
            {isAssistant && !isError && (
              <>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 rounded-md transition-colors" onClick={handleSpeech}>
                  {isPlaying ? <Loader2 size={10} className="animate-spin" /> : <Volume2 size={12} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 rounded-md transition-colors" onClick={onRegenerate}>
                  <RefreshCw size={12} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 rounded-md transition-colors">
                      {isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={12} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isAssistant ? "start" : "end"} className="rounded-xl p-1 shadow-xl border border-border bg-white min-w-[120px]">
                    {['Hindi', 'Bengali', 'Spanish', 'French', 'Japanese', 'German'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => handleTranslate(l)} className="text-[9px] font-black uppercase tracking-widest rounded-lg px-3 py-2 cursor-pointer text-primary hover:bg-primary hover:text-white">
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 rounded-md transition-colors" onClick={handleCopy}>
              {isCopied ? <Check size={10} className="text-emerald-700" /> : <Copy size={10} />}
            </Button>
            <div className="flex items-center justify-center bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              <span className="text-[8px] font-black font-mono text-primary leading-none">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}