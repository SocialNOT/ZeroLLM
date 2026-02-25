"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  Fingerprint,
  FileText,
  ShieldCheck,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const { user } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    email: "",
    mobile: "",
    photoURL: "",
    bio: "",
    newPassword: ""
  });

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        username: "",
        mobile: "",
        bio: "",
        newPassword: ""
      });

      const fetchProfile = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData(prev => ({
            ...prev,
            username: data.username || "",
            mobile: data.mobile || "",
            bio: data.bio || ""
          }));
        }
      };
      fetchProfile();
    }
  }, [isOpen, user, db]);

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateProfile(user, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });

      if (formData.newPassword) {
        try {
          await updatePassword(user, formData.newPassword);
        } catch (e: any) {
          toast({ variant: "destructive", title: "Security Node Error", description: "Password update requires a fresh login." });
        }
      }

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: formData.displayName,
        username: formData.username,
        mobile: formData.mobile,
        bio: formData.bio,
        photoURL: formData.photoURL,
        updatedAt: Date.now()
      }, { merge: true });

      toast({ title: "Neural Identity Synchronized", description: "Your core parameters have been persisted." });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failure", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:max-w-2xl border-primary/10 bg-white/95 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-none p-0 overflow-hidden outline-none gap-0 border flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 border-b border-primary/5 bg-white/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 rounded-none border-2 border-primary/20 shadow-xl">
                <AvatarImage src={formData.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email}`} />
                <AvatarFallback className="rounded-none bg-primary/5 text-primary font-black">
                  <User size={24} />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <ImageIcon size={16} className="text-white" />
              </div>
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="font-headline text-xl font-bold text-slate-900 tracking-tight leading-tight">
                Identity Configuration
              </DialogTitle>
              <DialogDescription className="text-primary font-bold text-[8px] uppercase tracking-widest mt-1">
                Refine your <span className="font-black">Neural Telemetry</span> and credentials.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Legal Name (Display)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                <Input 
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="rounded-none border-primary/10 bg-slate-50 h-11 pl-10 text-xs font-bold focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Neural Identifier (Username)</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                <Input 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="@operator_id"
                  className="rounded-none border-primary/10 bg-slate-50 h-11 pl-10 text-xs font-bold focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Email Node (Fixed)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <Input 
                  value={formData.email}
                  disabled
                  className="rounded-none border-primary/5 bg-slate-100 h-11 pl-10 text-xs font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Mobile Signal</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
                <Input 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  placeholder="+91 XXXX XXX XXX"
                  className="rounded-none border-primary/10 bg-slate-50 h-11 pl-10 text-xs font-bold focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Avatar Data URI / URL</Label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={14} />
              <Input 
                value={formData.photoURL}
                onChange={(e) => setFormData({...formData, photoURL: e.target.value})}
                placeholder="https://images.unsplash.com/..."
                className="rounded-none border-primary/10 bg-slate-50 h-11 pl-10 text-xs font-bold focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">Cognitive Bio</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-4 text-primary" size={14} />
              <Textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Brief summary of your neural expertise..."
                className="rounded-none border-primary/10 bg-slate-50 min-h-[100px] pl-10 text-xs font-medium focus:ring-primary/20 resize-none pt-3"
              />
            </div>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-100 space-y-3">
            <div className="flex items-center gap-2 text-rose-600">
              <Lock size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Sensitive Logic Update</span>
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-rose-600 ml-1">New Access Key (Password)</Label>
              <Input 
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                placeholder="Leave blank to maintain current signal"
                className="rounded-none border-rose-200 bg-white h-11 text-xs font-bold focus:ring-rose-100"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-primary/5 shrink-0 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider italic leading-none">Signal Secured via AES-256</span>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
            className="h-12 px-10 rounded-none bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-2xl shadow-primary/20 gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
            Commit Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
