
"use client";

import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, User, Bot, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "group flex w-full items-start gap-4 px-4 py-8 transition-colors hover:bg-white/5",
        isAssistant ? "bg-secondary/20" : "bg-transparent"
      )}
    >
      <div className="flex-shrink-0">
        <Avatar className={cn(
          "h-10 w-10 border",
          isAssistant ? "border-primary/50 bg-primary/10" : "border-accent/50 bg-accent/10"
        )}>
          {isAssistant ? (
            <>
              <AvatarFallback className="text-primary"><Bot size={20} /></AvatarFallback>
            </>
          ) : (
            <>
              <AvatarFallback className="text-accent"><User size={20} /></AvatarFallback>
            </>
          )}
        </Avatar>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {isAssistant ? "Aetheria Engine" : "You"}
          </span>
          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(message.content)}>
              <Copy size={14} />
            </Button>
          </div>
        </div>

        <div className={cn(
          "prose prose-invert max-w-none text-sm leading-relaxed",
          isAssistant ? "font-body" : "font-body text-foreground/90"
        )}>
          {message.content.split('\n').map((line, i) => (
            <p key={i} className="mb-2 last:mb-0">{line}</p>
          ))}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.citations.map((cite, i) => (
              <Badge key={i} variant="outline" className="flex items-center gap-1.5 border-accent/20 bg-accent/5 py-1 text-[10px] text-accent font-code">
                <FileText size={10} />
                {cite.source}{cite.page ? `, pg ${cite.page}` : ""}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
