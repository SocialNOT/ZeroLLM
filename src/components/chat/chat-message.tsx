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
      "group flex w-full items-start gap-6 py-10 transition-all border-b border-slate-50/50",
      isAssistant ? "bg-slate-50/30" : "bg-transparent"
    )}>
      <div className="flex-shrink-0 pt-1">
        <div className={cn(
          "relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-500",
          isAssistant ? "bg-white shadow-lg border border-primary/10" : "bg-slate-100 border border-slate-200"
        )}>
          {isAssistant ? (
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-pulse" />
              <Bot className="relative text-primary" size={22} />
            </div>
          ) : (
            <User className="text-slate-500" size={22} />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {isAssistant ? "AI Intelligence" : "Originator Node"}
            </span>
            {isAssistant && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-600 uppercase">Computed</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            {isAssistant && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white shadow-sm" onClick={handleSpeech}>
                  {isPlaying ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white shadow-sm" onClick={onRegenerate}>
                  <RefreshCw size={14} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white shadow-sm">
                      {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={14} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-xl">
                    {['Spanish', 'French', 'German', 'Chinese', 'Japanese'].map(l => (
                      <DropdownMenuItem key={l} onClick={() => handleTranslate(l)} className="text-xs font-bold rounded-xl cursor-pointer">
                        {l}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white shadow-sm" onClick={handleShare}>
              <Share2 size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-white shadow-sm" onClick={handleCopy}>
              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </Button>
          </div>
        </div>

        <div className={cn(
          "max-w-none text-[15px] leading-relaxed",
          isAssistant ? "text-slate-800 font-medium" : "text-slate-600"
        )}>
          {message.content.split('\n').map((line, i) => (
            <p key={i} className="mb-4 last:mb-0">{line}</p>
          ))}
        </div>
        
        {isAssistant && message.content.includes("ERROR:") && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3">
            <Cpu size={14} className="animate-pulse" />
            Node Protocol Failure: Establish engine connection or re-load model.
          </div>
        )}
      </div>
    </div>
  );
}