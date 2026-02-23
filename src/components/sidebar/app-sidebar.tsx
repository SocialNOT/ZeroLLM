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
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  Zap, 
  Plus, 
  Layers, 
  Settings2, 
  MessageSquare,
  Compass,
  X
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/settings/settings-dialog";

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

  const { isMobile, setOpenMobile } = useSidebar();

  const workspaceSessions = sessions.filter(s => s.workspaceId === activeWorkspaceId);

  const handleSessionClick = (id: string) => {
    setActiveSession(id);
    if (isMobile) setOpenMobile(false);
  };

  const handleWorkspaceClick = (id: string) => {
    setActiveWorkspace(id);
  };

  const handleCreateSession = () => {
    const id = createSession(activeWorkspaceId || '');
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-slate-50/50">
      <SidebarHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 text-white shrink-0">
              <Zap size={22} fill="currentColor" />
            </div>
            <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:hidden">
              <span className="font-headline text-lg font-bold leading-none text-slate-900">Aetheria</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Local Engine Hub</span>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" className="md:hidden text-slate-400" onClick={() => setOpenMobile(false)}>
              <X size={20} />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaces.map((ws) => (
                <SidebarMenuItem key={ws.id}>
                  <SidebarMenuButton 
                    isActive={activeWorkspaceId === ws.id}
                    onClick={() => handleWorkspaceClick(ws.id)}
                    className={cn(
                      "transition-all h-10",
                      activeWorkspaceId === ws.id 
                        ? "bg-white border border-slate-200 text-primary shadow-sm" 
                        : "text-slate-500 hover:bg-white/80"
                    )}
                  >
                    <Layers size={18} />
                    <span className="ml-2 font-semibold text-sm truncate">{ws.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <div className="mb-2 flex items-center justify-between px-3">
            <SidebarGroupLabel className="p-0 text-[10px] font-bold uppercase tracking-widest text-slate-400">Chronicle</SidebarGroupLabel>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-primary hover:bg-white group-data-[collapsible=icon]:hidden"
              onClick={handleCreateSession}
            >
              <Plus size={14} />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceSessions.length > 0 ? (
                workspaceSessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton 
                      isActive={activeSessionId === session.id}
                      onClick={() => handleSessionClick(session.id)}
                      className={cn(
                        "group/btn relative h-9 rounded-lg transition-all",
                        activeSessionId === session.id 
                          ? "bg-white border border-slate-100 text-slate-900 shadow-sm" 
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <MessageSquare size={16} />
                      <span className="ml-2 truncate font-medium text-xs">{session.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-3 py-4 text-[10px] text-slate-400 font-medium text-center border border-dashed border-slate-200 rounded-lg group-data-[collapsible=icon]:hidden">
                  No active threads
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 md:p-6">
        <SettingsDialog>
          <Button className="w-full h-11 bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all gap-2 px-0 group-data-[collapsible=icon]:rounded-full">
            <Settings2 size={18} className="shrink-0" />
            <span className="font-bold text-xs uppercase tracking-widest group-data-[collapsible=icon]:hidden">Settings</span>
          </Button>
        </SettingsDialog>
      </SidebarFooter>
    </Sidebar>
  );
}