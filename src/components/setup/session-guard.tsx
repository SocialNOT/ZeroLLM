"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, ShieldAlert, Lock, LogIn, Clock } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export function SessionGuard() {
  const { isSessionLocked, checkSessionExpiry, lockSession, currentUserRole } = useAppStore();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Identity monitor logic: Poll for Diurnal Reset synchronicity every 30 seconds.
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [checkSessionExpiry]);

  const handleReauth = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  if (!user || !isSessionLocked) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md w-[95vw] border-none bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] rounded-[3rem] p-8 outline-none z-[200]">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 animate-pulse">
              <Clock size={40} />
            </div>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-rose-600">
              <Lock size={14} />
            </div>
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-2xl font-headline font-black tracking-tight text-slate-900">
              Neural Session Expired
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              {currentUserRole === 'Viewer' 
                ? "Your Guest identity node has reached the Diurnal Reset limit (24:00). Please re-energize your session to continue."
                : "Your security node requires re-authentication to maintain signal integrity."}
            </DialogDescription>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full py-4">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</span>
              <span className="text-[10px] font-black text-rose-600 uppercase">Expired</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">Constraint</span>
              <span className="text-[10px] font-black text-slate-700 uppercase">Diurnal Reset</span>
            </div>
          </div>

          <Button 
            onClick={handleReauth}
            className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:scale-105 transition-all gap-3"
          >
            <LogIn size={18} />
            Re-energize Node
          </Button>
          
          <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-300">
            Secure Midnight Reset protocol active
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
