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
        setError("Protocol failed. Check endpoint node, authentication token, and firewall status.");
      }
    } catch (err) {
      setError("An unexpected neural node exception occurred.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <Card className="w-full border-white/10 bg-slate-900 shadow-3xl overflow-hidden rounded-[3rem]">
          <CardHeader className="text-center pt-12 pb-2">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-2xl shadow-primary/20">
              <Zap className="text-white" size={36} fill="currentColor" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold text-white tracking-tight">ZeroGPT Engine</CardTitle>
            <CardDescription className="text-slate-400 font-medium px-8 mt-2">Initialize your cognitive node by linking to a local or remote engine endpoint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-8 px-10">
            {error && (
              <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20 text-rose-400 rounded-2xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-bold uppercase tracking-widest">Protocol Failure</AlertTitle>
                <AlertDescription className="text-[11px] opacity-90">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Node API Endpoint</Label>
              <div className="relative">
                <Server className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  value={baseUrl} 
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="pl-12 border-slate-700 bg-slate-800 text-white rounded-2xl h-12 text-sm focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Access Secret (Optional)</Label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  type="password"
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pl-12 border-slate-700 bg-slate-800 text-white rounded-2xl h-12 text-sm focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Primary Model ID</Label>
              <div className="relative">
                <Cpu className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  value={modelId} 
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="llama3:8b"
                  className="pl-12 border-slate-700 bg-slate-800 text-white rounded-2xl h-12 text-sm focus:ring-primary/40"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pb-12 pt-6 px-10">
            <Button 
              onClick={handleStart} 
              disabled={!baseUrl || isTesting}
              className="w-full h-14 rounded-2xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-[11px] hover:scale-[1.02] transition-all shadow-2xl shadow-primary/20"
            >
              {isTesting ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" />Syncing...</> : "Authorize Handshake"}
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center opacity-60">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
            <span className="text-slate-500">Node crafted by</span>
            <a 
              href="https://www.eastindiaautomation.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="animate-color-shift inline-block"
            >
              Rajib Singh
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
