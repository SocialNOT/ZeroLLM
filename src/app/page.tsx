
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

  // Ensure there's always at least one session for the active workspace
  useEffect(() => {
    if (activeWorkspaceId && isConfigured) {
      const workspaceSessions = sessions.filter(s => s.workspaceId === activeWorkspaceId);
      if (workspaceSessions.length === 0) {
        createSession(activeWorkspaceId);
      } else if (!sessions.find(s => s.id === useAppStore.getState().activeSessionId)) {
        setActiveSession(workspaceSessions[0].id);
      }
    }
  }, [activeWorkspaceId, isConfigured]);

  if (!mounted) return null;

  return (
    <SidebarProvider>
      {!isConfigured && <SetupOverlay />}
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <ChatInterface />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
