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
  Share2, 
  Volume2,
  Check,
  Loader2,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
import { translateText } from "@/ai/flows/translate-flow";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    toast({ title: "Copied", duration: 1000 });
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
    setIsTranslating(true);
    try {
      const { translatedText } = await translateText({ text: message.content, targetLanguage: lang });
      toast({ title: `Translation (${lang})`, description: translatedText });
    } catch (error) {
      toast({ variant: "destructive", title: "Translation Error" });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={cn(
      "group flex w-full mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex max-w-[92%] sm:max-w-[85%] lg:max-w-[75%] gap-2 sm:gap-4",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <div className="flex-shrink-0 pt-1">
          <div className={cn(
            "h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg",
            isAssistant ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
          )}>
            {isAssistant ? <Bot size={16} className="sm:size-5" /> : <User size={16} className="sm:size-5" />}
          </div>
        </div>

        <div className={cn(
          "flex flex-col gap-1.5",
          isAssistant ? "items-start" : "items-end"
        )}>
          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
            {isAssistant ? "AI Engine" : "User Node"}
          </span>

          <div className={cn(
            "chat-bubble-base",
            isAssistant ? "chat-bubble-assistant" : "chat-bubble-user"
          )}>
            <div className="text-[13px] sm:text-[15px] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
          
          {isAssistant && message.content.includes("ERROR:") && (
            <div className="mt-2 p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Cpu size={10} className="animate-pulse" />
              Node Protocol Failure
            </div>
          )}

          <div className={cn(
            "flex items-center gap-1 mt-1 transition-all duration-300",
            "sm:opacity-0 sm:group-hover:opacity-100",
            !isAssistant && "flex-row-reverse"
          )}>
            {isAssistant && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full" onClick={handleSpeech}>
                  {isPlaying ? <Loader2 size={10} className="animate-spin" /> : <Volume2 size={12} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full" onClick={onRegenerate}>
                  <RefreshCw size={12} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full">
                      {isTranslating ? <Loader2 size={10} className="animate-spin" /> : <Languages size={12} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isAssistant ? "start" : "end"} className="rounded-xl p-1 shadow-xl">
                    {['Spanish', 'French', 'Japanese'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => handleTranslate(l)} className="text-[9px] font-bold uppercase tracking-widest rounded-lg">
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full" onClick={handleCopy}>
              {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}