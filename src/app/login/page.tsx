"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { auth } = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(user.email === 'admin@worldoftexts.com' ? '/admin' : '/');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    setError(null);
    setLoading(true);

    try {
      // Map "spider" username to email
      const email = username === 'spider' ? 'admin@worldoftexts.com' : username;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Ensure the admin profile exists in Firestore
      if (email === 'admin@worldoftexts.com') {
        const userRef = doc(db, "users", userCredential.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: userCredential.user.uid,
            email: email,
            role: "Admin",
            displayName: "Spider Admin"
          });
        }
      }

      toast({
        title: "Node Handshake Successful",
        description: `Welcome back, ${username}. Access granted.`,
      });
      
      router.push(email === 'admin@worldoftexts.com' ? '/admin' : '/');
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Authorization denied. Invalid credentials or node failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary shadow-xl shadow-primary/20">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-slate-900 tracking-tight">ZeroGPT Auth Node</CardTitle>
          <CardDescription className="text-slate-500">Establish a secure session to manage your AI hub.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-8">
          {error && (
            <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-[10px] font-bold uppercase tracking-widest">Protocol Failure</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Identity Node (Username/Email)</Label>
              <Input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="spider or email"
                className="rounded-2xl bg-slate-50 border-slate-200 text-slate-900 h-12 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Access Protocol (Password)</Label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-2xl bg-slate-50 border-slate-200 text-slate-900 h-12 focus:ring-primary/40"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-primary/20 mt-4"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Authorize Session"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-12 pt-4 text-center">
          <p className="w-full text-[10px] text-slate-400 uppercase tracking-widest">Encrypted Terminal • ZeroGPT Core</p>
        </CardFooter>
      </Card>
    </div>
  );
}