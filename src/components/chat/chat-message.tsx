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
  Terminal,
  AlertTriangle,
  Sparkles,
  Search,
  Brain,
  Zap,
  Microscope,
  ShieldCheck,
  Activity,
  LineChart,
  Clock,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateSpeech } from "@/ai/flows/speech-generation-flow";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const isError = isAssistant && (message.content.includes("ERROR:") || message.content.includes("FAILURE:"));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({ title: "Signal Copied", duration: 1000 });
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
      setIsPlaying(false);
    }
  };

  return (
    <div className={cn(
      "flex w-full px-2 animate-in fade-in slide-in-from-bottom-3 duration-700 min-w-0",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "flex flex-col border-2 shadow-2xl transition-all bg-white overflow-hidden min-w-0",
        isAssistant 
          ? isError ? "max-w-full border-rose-600" : "max-w-[95%] sm:max-w-[85%] border-primary mr-auto" 
          : "max-w-[90%] sm:max-w-[80%] border-slate-900 w-fit ml-auto"
      )}>
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 border-b-2 font-mono text-[10px] font-black uppercase tracking-widest select-none overflow-hidden",
          isAssistant 
            ? isError ? "bg-rose-600 text-white border-rose-700" : "bg-primary text-white border-primary"
            : "bg-slate-900 text-white border-slate-900"
        )}>
          <div className="flex h-5 w-5 items-center justify-center rounded bg-white/30 shrink-0">
            {isAssistant ? isError ? <AlertTriangle size={12} /> : <Bot size={12} /> : <User size={12} />}
          </div>
          <span className="truncate flex-1 font-black">{isAssistant ? isError ? "NODE_FAILURE" : "NEURAL_COMMAND_NODE" : "HUMAN_CORE_IDENTITY"}.MD</span>
          <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_5px_white]" />
        </div>

        <div className="p-4 sm:p-6 relative overflow-hidden min-w-0">
          <div className={cn(
            "text-[13px] sm:text-[15px] leading-tight font-bold break-words whitespace-pre-wrap text-slate-900",
            isError && "break-all font-mono text-[11px] text-rose-600"
          )}>
            {isAssistant && !isError ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  h1: ({...props}) => <h1 className="text-lg font-black mb-2 mt-4 text-primary border-b-2 border-primary/10" {...props} />,
                  h2: ({...props}) => <h2 className="text-md font-black mb-1 mt-3 text-primary" {...props} />,
                  ul: ({...props}) => <ul className="list-disc pl-6 mb-2 space-y-0.5" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal pl-6 mb-2 space-y-0.5" {...props} />,
                  strong: ({...props}) => <strong className="font-black text-primary" {...props} />,
                  code: ({node, inline, children, ...props}: any) => {
                    if (inline) return <code className="bg-primary/5 px-1 rounded text-[11px] font-mono text-primary border border-primary/10" {...props}>{children}</code>;
                    return (
                      <div className="my-2 border-2 border-primary/20 bg-slate-950 p-4 overflow-x-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10">
                          <span className="text-[10px] font-mono text-white/50 uppercase">Neural Code</span>
                          <Terminal size={12} className="text-white/50" />
                        </div>
                        <code className="text-[12px] font-mono text-slate-100 leading-tight block" {...props}>{children}</code>
                      </div>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="font-black">{message.content}</div>
            )}
          </div>
        </div>

        {isAssistant && !isError && (
          <>
            <button 
              type="button"
              onClick={() => setIsToolsExpanded(!isToolsExpanded)}
              className="w-full h-4 bg-slate-50 border-t-2 border-slate-100 hover:bg-slate-100 transition-colors flex items-center justify-center group"
            >
              {isToolsExpanded ? <ChevronDown size={14} className="text-primary" /> : <ChevronUp size={14} className="text-slate-400 group-hover:text-primary" />}
            </button>

            {isToolsExpanded && (
              <div className="grid grid-cols-6 divide-x-2 divide-slate-100 border-t-2 border-slate-100 bg-slate-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {[
                  { id: 'voice', icon: <Volume2 size={12} />, title: 'Voice', action: handleSpeech },
                  { id: 'regen', icon: <RefreshCw size={12} />, title: 'Regen', action: onRegenerate },
                  { id: 'think', icon: <Brain size={12} />, title: 'Deep', action: () => {} },
                  { id: 'verify', icon: <Search size={12} />, title: 'Fact', action: () => {} },
                  { id: 'academic', icon: <Microscope size={12} />, title: 'Study', action: () => {} },
                  { id: 'optimize', icon: <Zap size={12} />, title: 'Opt', action: () => {} },
                  { id: 'explain', icon: <Activity size={12} />, title: 'Logic', action: () => {} },
                  { id: 'audit', icon: <ShieldCheck size={12} />, title: 'Sec', action: () => {} },
                  { id: 'trace', icon: <LineChart size={12} />, title: 'Trace', action: () => {} },
                  { id: 'translate', icon: <Languages size={12} />, title: 'Lang', action: () => {} },
                  { id: 'copy', icon: <Copy size={12} />, title: 'Copy', action: handleCopy },
                ].map((btn, idx) => (
                  <button 
                    key={btn.id}
                    onClick={btn.action}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 hover:bg-primary/5 group transition-colors",
                      idx < 6 && "border-b-2 border-slate-100"
                    )}
                  >
                    <div className="text-primary group-hover:scale-110 transition-transform mb-0.5">{btn.icon}</div>
                    <span className="text-[6px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary">{btn.title}</span>
                  </button>
                ))}
                <div className="flex flex-col items-center justify-center py-2 bg-primary text-white">
                  <Clock size={12} className="mb-0.5" />
                  <span className="text-[7px] font-black font-mono">
                    {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}