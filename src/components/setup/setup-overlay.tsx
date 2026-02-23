"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Server, Cpu, Loader2, AlertCircle, Key } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SetupOverlay() {
  const { completeInitialSetup } = useAppStore();
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434/v1");
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setError(null);
    setIsTesting(true);
    try {
      const isOnline = await completeInitialSetup(baseUrl, modelId || "unspecified", apiKey);
      if (!isOnline) {
        setError("Could not reach the backend. Check the URL, API token, and ensure the server allows requests.");
      }
    } catch (err) {
      setError("An unexpected error occurred during setup.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-4">
      <Card className="w-full max-w-md border-white/10 bg-slate-900 shadow-2xl overflow-hidden rounded-[2.5rem]">
        <CardHeader className="text-center pb-2 pt-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary shadow-[0_0_30px_rgba(79,70,229,0.4)]">
            <Zap className="text-white" size={36} fill="currentColor" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold text-white tracking-tight">Initialize ZeroGPT</CardTitle>
          <CardDescription className="text-slate-400 font-medium">Link your command center to a local or remote engine node.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6 px-8">
          {error && (
            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-[11px] font-bold uppercase tracking-widest">Protocol Failure</AlertTitle>
              <AlertDescription className="text-xs opacity-90">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Node API Endpoint</Label>
            <div className="relative">
              <Server className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="pl-12 border-slate-700 bg-slate-800 text-white rounded-2xl h-12 text-sm focus:ring-primary/40 focus:border-primary/40"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">API Token (Optional)</Label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                type="password"
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pl-12 border-slate-700 bg-slate-800 text-white rounded-2xl h-12 text-sm focus:ring-primary/40 focus:border-primary/40"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Primary Model ID</Label>
            <div className="relative">
              <Cpu className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                value={modelId} 
                onChange={(e) => setModelId(e.target.value)}
                placeholder="llama3:8b"
                className="pl-12 border-slate-700 bg-slate-800 text-white rounded-2xl h-12 text-sm focus:ring-primary/40 focus:border-primary/40"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pb-10 pt-4 px-8">
          <Button 
            onClick={handleStart} 
            disabled={!baseUrl || isTesting}
            className="w-full h-14 rounded-2xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all shadow-xl shadow-primary/20"
          >
            {isTesting ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" />Handshaking...</> : "Authorize Connection"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
