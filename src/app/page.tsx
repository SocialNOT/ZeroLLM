
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useState } from "react";
import { SetupOverlay } from "@/components/setup/setup-overlay";

export default function Home() {
  const { 
    createSession, 
    activeWorkspaceId, 
    sessions, 
    setActiveSession, 
    activeSessionId,
    isConfigured 
  } = useAppStore();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isConfigured && mounted) {
      if (!sessions || sessions.length === 0) {
        createSession(activeWorkspaceId || 'ws-1');
      } else if (!activeSessionId) {
        setActiveSession(sessions[0].id);
      }
    }
  }, [isConfigured, sessions.length, activeWorkspaceId, mounted, activeSessionId, createSession, setActiveSession]);

  if (!mounted) return null;

  return (
    <SidebarProvider>
      {!isConfigured && <SetupOverlay />}
      <div className="flex h-svh w-full overflow-hidden bg-background p-0 sm:p-2">
        <div className="relative flex h-full w-full overflow-hidden sleek-animated-border rounded-none sm:rounded-[2.5rem] bg-card">
          <AppSidebar />
          <SidebarInset className="flex flex-col h-full overflow-hidden bg-transparent">
            <main className="flex-1 overflow-hidden relative">
              <ChatInterface />
            </main>
            <footer className="flex-shrink-0 w-full py-3 bg-card/50 backdrop-blur-md border-t border-border/10 text-center z-40 select-none">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                <span className="text-muted-foreground/40">Made with ❤️ by</span>
                <a 
                  href="https://www.eastindiaautomation.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="animate-color-shift hover:scale-105 transition-transform inline-block"
                >
                  Rajib Singh
                </a>
              </p>
            </footer>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
