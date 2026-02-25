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
  SidebarMenuAction,
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
  ChevronRight,
  Trash2,
  ShieldAlert,
  Edit2
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { LibraryEditor } from "@/components/library/library-editor";

export function AppSidebar() {
  const { 
    activeWorkspaceId, 
    sessions, 
    activeSessionId, 
    setActiveSession,
    createSession,
    deleteSession,
    personas,
    frameworks,
    linguisticControls,
    applyPersona,
    applyFramework,
    applyLinguisticControl
  } = useAppStore();

  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useUser();

  const customPersonas = personas.filter(p => p.isCustom);
  const customFrameworks = frameworks.filter(f => f.isCustom);
  const customControls = linguisticControls.filter(l => l.isCustom);

  const workspaceSessions = sessions.filter(s => s.workspaceId === activeWorkspaceId);

  const handleSessionClick = (id: string) => {
    setActiveSession(id);
    if (isMobile) setOpenMobile(false);
  };

  const handleCreateSession = () => {
    const id = createSession(activeWorkspaceId || 'ws-1');
    if (isMobile) setOpenMobile(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession(id);
  };

  const handleApplyItem = (type: 'persona' | 'framework' | 'linguistic', itemId: string) => {
    if (!activeSessionId) return;
    if (type === 'persona') applyPersona(activeSessionId, itemId);
    if (type === 'framework') applyFramework(activeSessionId, itemId);
    if (type === 'linguistic') applyLinguisticControl(activeSessionId, itemId);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-primary/10 bg-white/50 backdrop-blur-xl">
      <SidebarHeader className="p-6 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-6">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3 group group-data-[collapsible=icon]:gap-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/20 text-white shrink-0 group-hover:scale-105 transition-transform">
              <Zap size={24} fill="currentColor" className="animate-pulse" />
            </div>
            <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
              <span className="logo-shimmer font-headline text-2xl font-bold tracking-tighter leading-none whitespace-nowrap">ZEROGPT</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold opacity-100 whitespace-nowrap">Engine Node</span>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" className="md:hidden text-slate-900 rounded-full hover:bg-primary/5" onClick={() => setOpenMobile(false)}>
              <X size={20} />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 group-data-[collapsible=icon]:px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-2">Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                <SidebarMenuItem>
                  <Link href="/admin">
                    <SidebarMenuButton tooltip="Admin Panel" className="bg-primary/5 text-primary">
                      <ShieldAlert size={18} />
                      <span className="font-bold text-sm">Admin Control</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              
              {/* Personas Group */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Personas">
                      <UserCircle size={18} className="text-primary" />
                      <span className="font-bold text-sm">Personas</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <LibraryEditor mode="create" type="persona">
                    <SidebarMenuAction className="hover:bg-primary/5 text-primary group-data-[collapsible=icon]:hidden">
                      <Plus size={14} />
                    </SidebarMenuAction>
                  </LibraryEditor>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {customPersonas.length > 0 ? (
                        customPersonas.map(p => (
                          <SidebarMenuSubItem key={p.id} className="group/subitem">
                            <div className="flex items-center justify-between">
                              <SidebarMenuSubButton 
                                onClick={() => handleApplyItem('persona', p.id)}
                                className="text-[11px] font-black uppercase tracking-wider text-slate-900"
                              >
                                {p.name}
                              </SidebarMenuSubButton>
                              <LibraryEditor mode="edit" type="persona" item={p}>
                                <button className="opacity-0 group-hover/subitem:opacity-100 p-1 text-primary hover:scale-110 transition-all">
                                  <Edit2 size={10} />
                                </button>
                              </LibraryEditor>
                            </div>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <span className="text-[10px] text-slate-400 px-2 italic font-bold">No custom personas</span>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Frameworks Group */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Frameworks">
                      <Layers size={18} className="text-primary" />
                      <span className="font-bold text-sm">Frameworks</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <LibraryEditor mode="create" type="framework">
                    <SidebarMenuAction className="hover:bg-primary/5 text-primary group-data-[collapsible=icon]:hidden">
                      <Plus size={14} />
                    </SidebarMenuAction>
                  </LibraryEditor>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {customFrameworks.length > 0 ? (
                        customFrameworks.map(f => (
                          <SidebarMenuSubItem key={f.id} className="group/subitem">
                            <div className="flex items-center justify-between">
                              <SidebarMenuSubButton 
                                onClick={() => handleApplyItem('framework', f.id)}
                                className="text-[11px] font-black uppercase tracking-wider text-slate-900"
                              >
                                {f.name}
                              </SidebarMenuSubButton>
                              <LibraryEditor mode="edit" type="framework" item={f}>
                                <button className="opacity-0 group-hover/subitem:opacity-100 p-1 text-primary hover:scale-110 transition-all">
                                  <Edit2 size={10} />
                                </button>
                              </LibraryEditor>
                            </div>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <span className="text-[10px] text-slate-400 px-2 italic font-bold">No custom frameworks</span>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Controls Group */}
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Controls">
                      <Type size={18} className="text-primary" />
                      <span className="font-bold text-sm">Controls</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <LibraryEditor mode="create" type="linguistic">
                    <SidebarMenuAction className="hover:bg-primary/5 text-primary group-data-[collapsible=icon]:hidden">
                      <Plus size={14} />
                    </SidebarMenuAction>
                  </LibraryEditor>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {customControls.length > 0 ? (
                        customControls.map(c => (
                          <SidebarMenuSubItem key={c.id} className="group/subitem">
                            <div className="flex items-center justify-between">
                              <SidebarMenuSubButton 
                                onClick={() => handleApplyItem('linguistic', c.id)}
                                className="text-[11px] font-black uppercase tracking-wider text-slate-900"
                              >
                                {c.name}
                              </SidebarMenuSubButton>
                              <LibraryEditor mode="edit" type="linguistic" item={c}>
                                <button className="opacity-0 group-hover/subitem:opacity-100 p-1 text-primary hover:scale-110 transition-all">
                                  <Edit2 size={10} />
                                </button>
                              </LibraryEditor>
                            </div>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <span className="text-[10px] text-slate-400 px-2 italic font-bold">No custom controls</span>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <div className="mb-4 flex items-center justify-between px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
            <SidebarGroupLabel className="p-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900">Chronicle</SidebarGroupLabel>
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
                  <SidebarMenuItem key={session.id} className="group/item">
                    <SidebarMenuButton 
                      isActive={activeSessionId === session.id}
                      onClick={() => handleSessionClick(session.id)}
                      tooltip={session.title}
                      className={cn(
                        "group/btn relative h-10 rounded-xl px-3 mb-1 transition-all",
                        activeSessionId === session.id 
                          ? "bg-primary/5 text-primary font-bold shadow-sm" 
                          : "text-slate-900 hover:bg-primary/5"
                      )}
                    >
                      <MessageSquare size={16} className={activeSessionId === session.id ? "text-primary" : "text-slate-900"} />
                      <span className="ml-3 truncate font-black text-[11px] uppercase tracking-wider pr-6 group-data-[collapsible=icon]:hidden">{session.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="text-destructive hover:bg-destructive/5 rounded-lg z-50 transition-colors group-data-[collapsible=icon]:hidden"
                    >
                      <Trash2 size={12} />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="mx-2 px-4 py-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center border-2 border-dashed border-primary/10 rounded-[1.5rem] group-data-[collapsible=icon]:hidden">
                  No active threads
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 group-data-[collapsible=icon]:p-2">
        <SettingsDialog>
          <Button 
            variant="outline"
            tooltip="System Control"
            className="w-full h-12 bg-white border-primary/10 text-slate-900 shadow-xl shadow-primary/5 hover:bg-primary/5 hover:border-primary/30 rounded-2xl transition-all gap-3 px-0 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:mx-auto"
          >
            <Settings2 size={18} className="shrink-0 text-primary" />
            <span className="font-bold text-[10px] uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">System Control</span>
          </Button>
        </SettingsDialog>
      </SidebarFooter>
    </Sidebar>
  );
}