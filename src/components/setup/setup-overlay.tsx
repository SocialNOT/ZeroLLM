"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Server, Cpu, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SetupOverlay() {
  const { completeInitialSetup } = useAppStore();
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434/v1");
  const [modelId, setModelId] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setError(null);
    setIsTesting(true);
    
    try {
      const isOnline = await completeInitialSetup(baseUrl, modelId || "unspecified");
      if (!isOnline) {
        setError("Could not reach the backend. Ensure the server is running and CORS is allowed.");
      }
    } catch (err) {
      setError("An unexpected error occurred during setup.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4 overflow-y-auto">
      <Card className="w-full max-w-md border-white/10 bg-card/50 shadow-2xl my-auto">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Zap className="text-accent" size={32} fill="currentColor" />
          </div>
          <CardTitle className="font-headline text-2xl font-bold cyan-glow">Initialize Aetheria</CardTitle>
          <CardDescription>Connect to your local or remote LLM engine to begin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive text-xs py-2 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-[11px] font-bold">Connection Error</AlertTitle>
              <AlertDescription className="text-[10px] opacity-90">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">API Base URL</Label>
            <div className="relative">
              <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="pl-10 border-slate-200 bg-white rounded-xl h-11 text-sm focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Default Model ID (Optional)</Label>
            <div className="relative">
              <Cpu className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={modelId} 
                onChange={(e) => setModelId(e.target.value)}
                placeholder="e.g. llama3:8b"
                className="pl-10 border-slate-200 bg-white rounded-xl h-11 text-sm focus:ring-primary/20"
              />
            </div>
            <p className="text-[10px] text-muted-foreground px-1 italic">Discoverable models will be listed in settings once connected.</p>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            onClick={handleStart} 
            disabled={!baseUrl || isTesting}
            className="w-full h-12 rounded-xl bg-primary text-white font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              "Initialize Engine"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}