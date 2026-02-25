
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useAppStore } from "@/store/use-app-store";
import { useEffect, useState } from "react";
import { SetupOverlay } from "@/components/setup/setup-overlay";
import { SessionGuard } from "@/components/setup/session-guard";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Sliders, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDialog } from "@/components/profile/profile-dialog";
import { SettingsDialog } from "@/components/settings/settings-dialog";

export default function Home() {
  const { 
    createSession, 
    activeWorkspaceId, 
    sessions, 
    setActiveSession, 
    activeSessionId,
    isConfigured,
    checkConnection,
    activeTheme,
    aiMode
  } = useAppStore();
  
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showControlStep, setShowControlStep] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // IDENTITY GUARD: Absolute redirection to authentication node if signal is lost
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, mounted, router]);

  // INITIAL SEQUENCE: Orchestrate engine setup and protocol alignment
  useEffect(() => {
    if (isConfigured && mounted && user) {
      checkConnection();
      
      // Control Step only energized for local environments
      if (aiMode === 'offline' && !showControlStep && sessions.length === 0) {
        setShowControlStep(true);
      }

      if (!sessions || sessions.length === 0) {
        createSession(activeWorkspaceId || 'ws-1');
      } else if (!activeSessionId) {
        setActiveSession(sessions[0].id);
      }
    }
  }, [isConfigured, sessions.length, activeWorkspaceId, mounted, activeSessionId, createSession, setActiveSession, checkConnection, user, aiMode, showControlStep]);

  if (!mounted || authLoading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary animate-pulse">Syncing Core Identity...</p>
        </div>
      </div>
    );
  }

  let themeClass = "";
  if (activeTheme === 'auto') {
    const day = (new Date().getDay() + 6) % 7; 
    themeClass = `theme-${day}`;
  } else {
    themeClass = `theme-${activeTheme}`;
  }

  return (
    <div className={cn("h-svh w-full overflow-hidden transition-colors duration-500", themeClass)}>
      <div className="sleek-animated-border-container h-full w-full">
        <div className="app-surface flex h-full w-full">
          <SidebarProvider>
            {/* Stable Root Modals */}
            <ProfileDialog />
            <SettingsDialog />
            <SessionGuard />
            
            {/* STAGE 2: Engine Handshake */}
            {!isConfigured && <SetupOverlay />}

            {/* STAGE 3: Protocol Tuning (Offline Nodes Only) */}
            {isConfigured && showControlStep && aiMode === 'offline' && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/95 backdrop-blur-3xl p-4">
                <div className="max-w-sm w-full space-y-8 animate-in fade-in zoom-in duration-500 text-center">
                  <div className="space-y-2">
                    <div className="h-16 w-16 bg-primary/5 rounded-none mx-auto flex items-center justify-center text-primary border-2 border-primary/10">
                      <Sliders size={32} />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Protocol Tuning</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Configure Identity & Architecture for Offline Node</p>
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-2 border-slate-900 rounded-none text-left space-y-4">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-primary">Status</span>
                      <p className="text-[11px] font-bold text-slate-900 leading-tight uppercase">Local Engine Energized. Persistence requires protocol alignment.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-primary">Access</span>
                      <p className="text-[11px] font-bold text-slate-900 leading-tight uppercase">Unlimited Local Compute Active. No temporal constraints detected.</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setShowControlStep(false)}
                    className="w-full h-14 rounded-none bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 hover:scale-105 transition-all gap-3"
                  >
                    Enter Command Hub
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}

            {/* STAGE 4: Neural Command Hub */}
            <div className="flex h-full w-full overflow-hidden bg-background">
              <AppSidebar />
              <SidebarInset className="flex flex-col h-full overflow-hidden bg-transparent">
                <main className="flex-1 overflow-hidden relative">
                  <ChatInterface />
                </main>
                <footer className="flex-shrink-0 w-full py-1.5 bg-background border-t border-border/50 text-center z-40 select-none">
                  <p className="text-[8px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                    <span className="text-foreground/80">Made with ❤️</span>
                    <a 
                      href="https://www.eastindiaautomation.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="logo-shimmer hover:scale-105 transition-transform inline-block font-black"
                    >
                      Rajib Singh
                    </a>
                  </p>
                </footer>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>
      </div>
    </div>
  );
}
