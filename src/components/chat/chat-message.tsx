"use client";

import React, { useState } from "react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    toast({ title: "Copied to clipboard", duration: 1500 });
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
      toast({ variant: "destructive", title: "Audio Error", description: "Failed to generate speech." });
      setIsPlaying(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    setIsTranslating(true);
    try {
      const { translatedText } = await translateText({ text: message.content, targetLanguage: lang });
      toast({ title: `Translated to ${lang}`, description: translatedText });
    } catch (error) {
      toast({ variant: "destructive", title: "Translation Error" });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aetheria AI Response',
          text: message.content,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy();
      toast({ title: "Sharing not supported", description: "Copied to clipboard instead." });
    }
  };

  return (
    <div className={cn(
      "group flex w-full mb-10 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex max-w-[85%] lg:max-w-[75%] gap-4",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        <div className="flex-shrink-0 pt-1">
          <div className={cn(
            "relative h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
            isAssistant ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
          )}>
            {isAssistant ? (
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-lg rounded-full animate-pulse" />
                <Bot className="relative" size={20} />
              </div>
            ) : (
              <User size={20} />
            )}
          </div>
        </div>

        <div className={cn(
          "flex flex-col gap-2",
          isAssistant ? "items-start" : "items-end"
        )}>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              {isAssistant ? "AI Intelligence" : "Originator Node"}
            </span>
            {isAssistant && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-bold text-emerald-600 uppercase tracking-tighter">Computed</span>
              </div>
            )}
          </div>

          <div className={cn(
            "px-6 py-4 rounded-[2rem] shadow-xl text-[15px] leading-relaxed transition-all",
            isAssistant 
              ? "bg-accent text-accent-foreground rounded-tl-none" 
              : "bg-primary text-primary-foreground rounded-tr-none"
          )}>
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-4 last:mb-0">{line}</p>
            ))}
          </div>
          
          {isAssistant && message.content.includes("ERROR:") && (
            <div className="mt-2 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <Cpu size={12} className="animate-pulse" />
              Node Protocol Failure: Establish connection.
            </div>
          )}

          <div className={cn(
            "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0",
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
                  <DropdownMenuContent align="start" className="rounded-2xl p-2 border-border shadow-xl">
                    {['Spanish', 'French', 'German', 'Chinese', 'Japanese'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => handleTranslate(l)} className="text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer">
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full" onClick={handleShare}>
              <Share2 size={12} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full" onClick={handleCopy}>
              {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
