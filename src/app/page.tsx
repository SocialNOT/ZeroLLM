"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useState } from "react";
import { SetupOverlay } from "@/components/setup/setup-overlay";

export default function Home() {
  const { createSession, activeWorkspaceId, sessions, setActiveSession, isConfigured } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Ensure there's always at least one session
  useEffect(() => {
    if (isConfigured) {
      if (sessions.length === 0) {
        createSession(activeWorkspaceId || 'default');
      } else if (!useAppStore.getState().activeSessionId) {
        setActiveSession(sessions[0].id);
      }
    }
  }, [isConfigured, sessions.length]);

  if (!mounted) return null;

  return (
    <SidebarProvider>
      {!isConfigured && <SetupOverlay />}
      <div className="flex h-svh w-full overflow-hidden bg-background p-0 sm:p-2">
        <div className="relative flex h-full w-full overflow-hidden sleek-animated-border">
          <AppSidebar />
          <SidebarInset className="flex flex-col overflow-hidden bg-transparent">
            <main className="flex-1 overflow-hidden">
              <ChatInterface />
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}