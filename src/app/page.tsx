
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useState } from "react";
import { SetupOverlay } from "@/components/setup/setup-overlay";
import { SessionGuard } from "@/components/setup/session-guard";
import { cn } from "@/lib/utils";

export default function Home() {
  const { 
    createSession, 
    activeWorkspaceId, 
    sessions, 
    setActiveSession, 
    activeSessionId,
    isConfigured,
    checkConnection,
    activeTheme
  } = useAppStore();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isConfigured && mounted) {
      checkConnection();
      if (!sessions || sessions.length === 0) {
        createSession(activeWorkspaceId || 'ws-1');
      } else if (!activeSessionId) {
        setActiveSession(sessions[0].id);
      }
    }
  }, [isConfigured, sessions.length, activeWorkspaceId, mounted, activeSessionId, createSession, setActiveSession, checkConnection]);

  if (!mounted) return null;

  // Determine actual theme class
  let themeClass = "";
  if (activeTheme === 'auto') {
    // 0 is Sunday, 1 is Monday in JS getDay()
    // We want Monday to be index 0
    const day = (new Date().getDay() + 6) % 7; 
    themeClass = `theme-${day}`;
  } else {
    themeClass = `theme-${activeTheme}`;
  }

  return (
    <div className={cn("h-svh w-full overflow-hidden", themeClass)}>
      <SidebarProvider>
        <SessionGuard />
        {!isConfigured && <SetupOverlay />}
        <div className="flex h-svh w-full overflow-hidden bg-background">
          <div className="relative flex h-full w-full overflow-hidden sleek-animated-border rounded-none bg-card">
            <AppSidebar />
            <SidebarInset className="flex flex-col h-full overflow-hidden bg-transparent">
              <main className="flex-1 overflow-hidden relative">
                <ChatInterface />
              </main>
              <footer className="flex-shrink-0 w-full py-2 bg-card/50 backdrop-blur-md border-t border-border text-center z-40 select-none">
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                  <span className="text-foreground/60">Made with ❤️ by</span>
                  <a 
                    href="https://www.eastindiaautomation.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="logo-shimmer hover:scale-105 transition-transform inline-block"
                  >
                    Rajib Singh
                  </a>
                </p>
              </footer>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
