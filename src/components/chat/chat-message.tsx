
"use client";

import React, { useState } from "react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Copy, 
  User, 
  Bot, 
  Play, 
  RefreshCw, 
  Languages, 
  Share2, 
  Volume2,
  Check,
  Loader2
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
      "group flex w-full items-start gap-4 px-4 py-8 transition-all border-b border-slate-50/50",
      isAssistant ? "bg-slate-50/40" : "bg-white"
    )}>
      <div className="flex-shrink-0">
        <Avatar className={cn(
          "h-10 w-10 border transition-all duration-500",
          isAssistant ? "border-primary/20 bg-white" : "border-slate-200 bg-white"
        )}>
          {isAssistant ? (
            <AvatarFallback className="bg-primary/5 text-primary"><Bot size={20} /></AvatarFallback>
          ) : (
            <AvatarFallback className="bg-slate-100 text-slate-600"><User size={20} /></AvatarFallback>
          )}
        </Avatar>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {isAssistant ? "Engine Response" : "Originator"}
            </span>
            {isAssistant && (
              <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isAssistant && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={handleSpeech}>
                  {isPlaying ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={onRegenerate}>
                  <RefreshCw size={12} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary">
                      {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => handleTranslate('Spanish')}>Spanish</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTranslate('French')}>French</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTranslate('German')}>German</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTranslate('Chinese')}>Chinese</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTranslate('Japanese')}>Japanese</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={handleShare}>
              <Share2 size={12} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={handleCopy}>
              {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </Button>
          </div>
        </div>

        <div className={cn(
          "max-w-none text-sm leading-relaxed",
          isAssistant ? "text-slate-800 font-medium" : "text-slate-600"
        )}>
          {message.content.split('\n').map((line, i) => (
            <p key={i} className="mb-2 last:mb-0">{line}</p>
          ))}
        </div>
        
        {isAssistant && message.content.includes("ERROR:") && (
          <div className="mt-2 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold uppercase tracking-tighter">
            Action Required: Check connection or load model to memory.
          </div>
        )}
      </div>
    </div>
  );
}
