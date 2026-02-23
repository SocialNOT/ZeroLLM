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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from "@/components/ui/sidebar";
import { 
  Zap, 
  Plus, 
  Settings2, 
  MessageSquare,
  X,
  UserCircle,
  Layers,
  Type,
  ChevronRight
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function AppSidebar() {
  const { 
    activeWorkspaceId, 
    sessions, 
    activeSessionId, 
    setActiveSession,
    createSession,
    personas,
    frameworks,
    linguisticControls
  } = useAppStore();

  const { isMobile, setOpenMobile } = useSidebar();

  // Filter for custom configurations
  const customPersonas = personas.filter(p => p.isCustom);
  const customFrameworks = frameworks.filter(f => f.isCustom);
  const customControls = linguisticControls.filter(l => l.isCustom);

  const workspaceSessions = sessions.filter(s => s.workspaceId === activeWorkspaceId);

  const handleSessionClick = (id: string) => {
    setActiveSession(id);
    if (isMobile) setOpenMobile(false);
  };

  const handleCreateSession = () => {
    const id = createSession(activeWorkspaceId || '');
    if (isMobile) setOpenMobile(false);
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
              <span className="logo-shimmer font-headline text-2xl font-bold tracking-tighter leading-none">ZEROGPT</span>
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
        {/* Library Group for Custom Configurations */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Custom Personas */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Personas">
                      <UserCircle size={18} className="text-slate-400" />
                      <span className="font-bold text-sm">Personas</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {customPersonas.length > 0 ? (
                        customPersonas.map(p => (
                          <SidebarMenuSubItem key={p.id}>
                            <SidebarMenuSubButton className="text-[11px] font-medium uppercase tracking-wider">{p.name}</SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <span className="text-[10px] text-slate-400 px-2 italic">No custom personas</span>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Custom Frameworks */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Frameworks">
                      <Layers size={18} className="text-slate-400" />
                      <span className="font-bold text-sm">Frameworks</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {customFrameworks.length > 0 ? (
                        customFrameworks.map(f => (
                          <SidebarMenuSubItem key={f.id}>
                            <SidebarMenuSubButton className="text-[11px] font-medium uppercase tracking-wider">{f.name}</SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <span className="text-[10px] text-slate-400 px-2 italic">No custom frameworks</span>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Custom Controls */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Controls">
                      <Type size={18} className="text-slate-400" />
                      <span className="font-bold text-sm">Controls</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {customControls.length > 0 ? (
                        customControls.map(c => (
                          <SidebarMenuSubItem key={c.id}>
                            <SidebarMenuSubButton className="text-[11px] font-medium uppercase tracking-wider">{c.name}</SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <span className="text-[10px] text-slate-400 px-2 italic">No custom controls</span>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chronicle (History) Group */}
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
