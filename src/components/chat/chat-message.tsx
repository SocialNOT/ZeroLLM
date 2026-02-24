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
      
      // Add translation as a new chat bubble
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
        "flex max-w-[95%] sm:max-w-[85%] lg:max-w-[80%] gap-3 sm:gap-4",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <div className="flex-shrink-0 pt-1">
          <div className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shadow-md border transition-transform group-hover:scale-105",
            isAssistant 
              ? isError ? "bg-rose-50 text-rose-500 border-rose-200" : "bg-accent/10 text-accent border-accent/20" 
              : "bg-primary text-primary-foreground border-primary/20"
          )}>
            {isAssistant ? <Bot size={16} /> : <User size={16} />}
          </div>
        </div>

        <div className={cn(
          "flex flex-col gap-1.5",
          isAssistant ? "items-start" : "items-end"
        )}>
          <div className="flex items-center gap-2 px-1">
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-widest",
              isError ? "text-rose-500" : "text-muted-foreground/50"
            )}>
              {isAssistant ? isError ? "Node Error" : "Neural Node" : "Human Identity"}
            </span>
            {message.content.includes("[TRANSLATION:") && (
              <Badge variant="outline" className="text-[7px] font-bold uppercase py-0 px-1 border-emerald-500/20 bg-emerald-500/5 text-emerald-500">
                Linguistic Layer
              </Badge>
            )}
          </div>

          <div className={cn(
            "p-4 sm:p-5 rounded-2xl shadow-sm transition-all relative overflow-hidden",
            isAssistant 
              ? isError 
                ? "bg-rose-50/50 border border-rose-100 text-rose-900 rounded-tl-none" 
                : "bg-white border border-border text-slate-900 rounded-tl-none" 
              : "bg-primary text-primary-foreground rounded-tr-none"
          )}>
            <div className={cn(
              "text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap relative z-10",
              isError && "font-mono text-[11px] text-rose-700"
            )}>
              {message.content}
            </div>
            {isAssistant && !isError && (
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Sparkles size={40} className="text-primary" />
              </div>
            )}
          </div>

          <div className={cn(
            "flex items-center gap-1 mt-1 transition-all duration-300 opacity-0 group-hover:opacity-100",
            !isAssistant && "flex-row-reverse"
          )}>
            {isAssistant && !isError && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-primary rounded-lg transition-colors" onClick={handleSpeech}>
                  {isPlaying ? <Loader2 size={10} className="animate-spin" /> : <Volume2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-primary rounded-lg transition-colors" onClick={onRegenerate}>
                  <RefreshCw size={14} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-primary rounded-lg transition-colors">
                      {isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={14} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isAssistant ? "start" : "end"} className="rounded-xl p-1 shadow-2xl border-border bg-white/95 backdrop-blur-xl">
                    {['Hindi', 'Bengali (India)', 'Spanish', 'French', 'Japanese', 'German'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => handleTranslate(l)} className="text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-2 cursor-pointer">
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-primary rounded-lg transition-colors" onClick={handleCopy}>
              {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
