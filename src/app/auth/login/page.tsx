
"use client";

import React, { useState } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Zap, Mail, Lock, LogIn, Github, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/use-app-store";

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { startSession } = useAppStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const syncUserProfile = async (user: any) => {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const role = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? "Admin" : "User";
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        role: role,
        createdAt: Date.now()
      });
    }
    
    // Energize security session
    startSession();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isRegistering) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserProfile(user);
        toast({ title: "Neural Node Created", description: "Your identity has been persisted." });
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await syncUserProfile(user);
        toast({ title: "Handshake Successful", description: "Neural session energized." });
      }
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Protocol Failure", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await syncUserProfile(user);
      toast({ title: "Google Identity Linked", description: "Signal synchronized." });
      router.push("/");
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 'auth/configuration-not-found') {
        errorMessage = "Google Auth is not enabled. Please enable Google Sign-in in your Firebase Console (Authentication > Sign-in method).";
      }
      toast({ variant: "destructive", title: "Google Protocol Failure", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-[1.5rem] bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20 mb-6">
            <Zap size={32} fill="currentColor" />
          </div>
          <h1 className="logo-shimmer font-headline text-4xl font-black tracking-tighter">ZEROGPT</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 mt-2">Initialize Identity Node</p>
        </div>

        <Card className="border-none bg-white shadow-[0_40px_120px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">{isRegistering ? "Create Node" : "Energize Session"}</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure Cloud Handshake</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Identifier</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@node.com"
                    className="pl-10 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold h-11" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-10 rounded-xl border-slate-100 bg-slate-50 text-xs font-bold h-11" 
                  />
                </div>
              </div>
              <Button disabled={isLoading} className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <LogIn size={16} />}
                {isRegistering ? "Create Node" : "Authenticate"}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">Or Federated Identity</span></div>
            </div>

            <Button onClick={handleGoogleAuth} variant="outline" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 border-slate-100">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex justify-center py-4">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              {isRegistering ? "Back to Login" : "Initialize New Node"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
