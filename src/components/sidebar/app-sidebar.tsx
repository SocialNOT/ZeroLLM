
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
  Edit2,
  LogOut,
  User
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProfileDialog } from "@/components/profile/profile-dialog";

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
    applyLinguisticControl,
    currentUserRole
  } = useAppStore();

  const { isMobile, setOpenMobile } = useSidebar();
  const { user } = useUser();
  const auth = useAuth();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

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

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-primary/10 bg-white/50 backdrop-blur-xl">
      <ProfileDialog isOpen={isProfileOpen} onOpenChange={setIsProfileOpen} />
      
      <SidebarHeader className="p-6 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-6">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-3 group group-data-[collapsible=icon]:gap-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-none bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/20 text-white shrink-0 group-hover:scale-105 transition-transform border-2 border-primary/20">
              <Zap size={24} fill="currentColor" className="animate-pulse" />
            </div>
            <div className="flex flex-col overflow-hidden transition-all group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
              <span className="logo-shimmer font-headline text-2xl font-bold tracking-tighter leading-none whitespace-nowrap">ZEROGPT</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold opacity-100 whitespace-nowrap">Engine Node</span>
            </div>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" className="md:hidden text-slate-900 rounded-none hover:bg-primary/5" onClick={() => setOpenMobile(false)}>
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
                    <SidebarMenuButton tooltip="Admin Panel" className="bg-primary/5 text-primary rounded-none">
                      <ShieldAlert size={18} />
                      <span className="font-bold text-sm">Admin Control</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              
              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Personas" className="rounded-none">
                      <UserCircle size={18} className="text-primary" />
                      <span className="font-bold text-sm text-slate-900">Personas</span>
                      <ChevronRight className="ml-auto text-slate-900 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
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
                                className="text-[11px] font-black uppercase tracking-wider text-slate-900 rounded-none"
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

              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Frameworks" className="rounded-none">
                      <Layers size={18} className="text-primary" />
                      <span className="font-bold text-sm text-slate-900">Frameworks</span>
                      <ChevronRight className="ml-auto text-slate-900 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
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
                                className="text-[11px] font-black uppercase tracking-wider text-slate-900 rounded-none"
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

              <Collapsible asChild className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="My Controls" className="rounded-none">
                      <Type size={18} className="text-primary" />
                      <span className="font-bold text-sm text-slate-900">Controls</span>
                      <ChevronRight className="ml-auto text-slate-900 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
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
                                className="text-[11px] font-black uppercase tracking-wider text-slate-900 rounded-none"
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
              className="h-8 w-8 rounded-none bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all group-data-[collapsible=icon]:hidden"
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
                        "group/btn relative h-10 rounded-none px-3 mb-1 transition-all",
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
                      className="text-destructive hover:bg-destructive/5 rounded-none z-50 transition-colors group-data-[collapsible=icon]:hidden"
                    >
                      <Trash2 size={12} />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="mx-2 px-4 py-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center border-2 border-dashed border-primary/10 rounded-none group-data-[collapsible=icon]:hidden">
                  No active threads
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 space-y-2 border-t border-primary/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="rounded-none hover:bg-primary/5 transition-all h-14 border border-primary/10 bg-white">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-8 w-8 rounded-none border border-primary/20 shrink-0">
                      <AvatarImage src={user?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email}`} />
                      <AvatarFallback className="rounded-none bg-primary/10 text-primary font-black"><User size={16} /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left overflow-hidden group-data-[collapsible=icon]:hidden">
                      <span className="text-[10px] font-black uppercase text-slate-900 truncate leading-none mb-1">{user?.displayName || user?.email?.split('@')[0]}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 bg-emerald-500 rounded-none animate-pulse" />
                        <span className="text-[7px] font-bold uppercase tracking-widest text-primary">{currentUserRole} Node</span>
                      </div>
                    </div>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="rounded-none border-2 border-primary/20 shadow-2xl p-1 w-56 bg-white z-[200]">
                <div className="px-3 py-2 border-b-2 border-primary/5 mb-1 bg-slate-50">
                  <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-0.5">Identity Protocol</p>
                  <p className="text-[10px] font-bold text-slate-900 truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="text-[9px] font-black uppercase tracking-widest text-slate-900 focus:bg-primary/5 cursor-pointer rounded-none p-3 gap-2">
                  <UserCircle size={14} className="text-primary" />
                  Configure Identity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-[9px] font-black uppercase tracking-widest text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer rounded-none p-3 gap-2">
                  <LogOut size={14} />
                  Terminate Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        <SettingsDialog>
          <Button 
            variant="outline"
            tooltip="System Control"
            className="w-full h-12 bg-white border-primary/10 text-slate-900 shadow-xl shadow-primary/5 hover:bg-primary/5 hover:border-primary/30 rounded-none transition-all gap-3 px-0 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:mx-auto"
          >
            <Settings2 size={18} className="shrink-0 text-primary" />
            <span className="font-bold text-[10px] uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">System Control</span>
          </Button>
        </SettingsDialog>
      </SidebarFooter>
    </Sidebar>
  );
}
