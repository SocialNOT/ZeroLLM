
"use client";

import * as React from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { 
  Zap, 
  Plus, 
  Book, 
  GraduationCap, 
  Code, 
  Settings2, 
  MessageSquare, 
  Box,
  ChevronRight
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspace, 
    sessions, 
    activeSessionId, 
    setActiveSession,
    createSession 
  } = useAppStore();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const workspaceSessions = sessions.filter(s => s.workspaceId === activeWorkspaceId);

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Zap className="text-accent" size={24} fill="currentColor" />
          </div>
          <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:hidden">
            <span className="font-headline text-lg font-bold leading-none cyan-glow">Aetheria AI</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">ZeroLLM Engine</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {workspaces.map((ws) => (
                <SidebarMenuItem key={ws.id}>
                  <SidebarMenuButton 
                    isActive={activeWorkspaceId === ws.id}
                    onClick={() => setActiveWorkspace(ws.id)}
                    tooltip={ws.name}
                    className={cn(
                      "transition-all",
                      activeWorkspaceId === ws.id ? "bg-primary/20 text-accent font-semibold" : "hover:bg-white/5"
                    )}
                  >
                    {ws.icon === 'zap' ? <Zap size={18} /> : <Book size={18} />}
                    <span className="ml-2 truncate">{ws.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
                  <Plus size={18} />
                  <span className="ml-2">New Workspace</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="mb-2 flex items-center justify-between px-4">
            <SidebarGroupLabel className="p-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">History</SidebarGroupLabel>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-accent group-data-[collapsible=icon]:hidden"
              onClick={() => createSession(activeWorkspaceId || '')}
            >
              <Plus size={14} />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {workspaceSessions.length > 0 ? (
                workspaceSessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton 
                      isActive={activeSessionId === session.id}
                      onClick={() => setActiveSession(session.id)}
                      className={cn(
                        "group/btn relative overflow-hidden",
                        activeSessionId === session.id ? "bg-white/5 text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <MessageSquare size={16} />
                      <span className="ml-2 truncate font-body text-xs">{session.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-2 text-[10px] text-muted-foreground italic group-data-[collapsible=icon]:hidden">No history yet</div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-12 border border-white/5 bg-white/5 transition-all hover:bg-white/10">
              <Settings2 size={18} className="text-accent" />
              <span className="ml-2 font-headline font-medium">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
