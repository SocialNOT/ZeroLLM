"use client";

import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, User, Bot, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({ title: "Copied to clipboard", duration: 1500 });
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary hover:bg-white" 
            onClick={handleCopy}
          >
            <Copy size={14} />
          </Button>
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
