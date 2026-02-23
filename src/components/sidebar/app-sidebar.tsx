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
  X,
  Cpu,
  Globe,
  Database,
  Calculator,
  Terminal,
  Activity
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspace, 
    sessions, 
    activeSessionId, 
    setActiveSession,
    createSession,
    availableTools,
    activeConnectionId,
    connections
  } = useAppStore();

  const { isMobile, setOpenMobile } = useSidebar();
  const activeConn = connections.find(c => c.id === activeConnectionId);

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

  const getToolIcon = (id: string) => {
    switch (id) {
      case 'calculator': return <Calculator size={14} />;
      case 'web_search': return <Globe size={14} />;
      case 'knowledge_search': return <Database size={14} />;
      case 'code_interpreter': return <Terminal size={14} />;
      default: return <Zap size={14} />;
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-100 bg-white/50 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary to-indigo-600 shadow-xl shadow-primary/20 text-white shrink-0 group-hover:scale-105 transition-transform">
              <Zap size={24} fill="currentColor" className="animate-pulse" />
            </div>
            <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:hidden">
              <span className="font-headline text-xl font-bold tracking-tight text-slate-900">Aetheria Hub</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold opacity-60">Engine Node</span>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" className="md:hidden text-slate-400 rounded-full hover:bg-slate-100" onClick={() => setOpenMobile(false)}>
              <X size={20} />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaces.map((ws) => (
                <SidebarMenuItem key={ws.id}>
                  <SidebarMenuButton 
                    isActive={activeWorkspaceId === ws.id}
                    onClick={() => handleWorkspaceClick(ws.id)}
                    className={cn(
                      "transition-all h-11 rounded-2xl px-3",
                      activeWorkspaceId === ws.id 
                        ? "bg-white border border-slate-100 text-primary shadow-lg" 
                        : "text-slate-500 hover:bg-white/80"
                    )}
                  >
                    <Layers size={18} className={activeWorkspaceId === ws.id ? "text-primary" : "text-slate-400"} />
                    <span className="ml-3 font-bold text-sm truncate">{ws.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Intelligence Nodes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {availableTools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 group-data-[collapsible=icon]:justify-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                        {getToolIcon(tool.id)}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest group-data-[collapsible=icon]:hidden">{tool.name}</span>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse group-data-[collapsible=icon]:hidden" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <div className="mb-4 flex items-center justify-between px-3">
            <SidebarGroupLabel className="p-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Chronicle</SidebarGroupLabel>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all group-data-[collapsible=icon]:hidden"
              onClick={handleCreateSession}
            >
              <Plus size={16} />
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
                        "group/btn relative h-10 rounded-xl px-3 mb-1 transition-all",
                        activeSessionId === session.id 
                          ? "bg-primary/5 text-primary font-bold shadow-sm" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <MessageSquare size={16} className={activeSessionId === session.id ? "text-primary" : "text-slate-400"} />
                      <span className="ml-3 truncate font-bold text-[11px] uppercase tracking-wider">{session.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="mx-2 px-4 py-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center border-2 border-dashed border-slate-100 rounded-[1.5rem] group-data-[collapsible=icon]:hidden">
                  No active threads
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <SettingsDialog>
          <Button className="w-full h-12 bg-white border border-slate-100 text-slate-700 shadow-xl shadow-slate-200/50 hover:border-primary/30 hover:text-primary rounded-2xl transition-all gap-3 px-0 group-data-[collapsible=icon]:rounded-full">
            <Settings2 size={18} className="shrink-0" />
            <span className="font-bold text-[10px] uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">System Control</span>
          </Button>
        </SettingsDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
