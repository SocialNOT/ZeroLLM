
"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Server, Cpu, Loader2 } from "lucide-react";

export function SetupOverlay() {
  const { completeInitialSetup } = useAppStore();
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434/v1");
  const [modelId, setModelId] = useState("llama3:8b");
  const [isTesting, setIsTesting] = useState(false);

  const handleStart = () => {
    setIsTesting(true);
    // Simulate a connection check
    setTimeout(() => {
      completeInitialSetup(baseUrl, modelId);
      setIsTesting(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl">
      <Card className="w-full max-w-md border-white/10 bg-card/50 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Zap className="text-accent" size={32} fill="currentColor" />
          </div>
          <CardTitle className="font-headline text-2xl font-bold cyan-glow">Initialize Aetheria</CardTitle>
          <CardDescription>Connect to your local or remote LLM engine to begin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Base URL</Label>
            <div className="relative">
              <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="pl-10 border-white/10 bg-white/5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default Model ID</Label>
            <div className="relative">
              <Cpu className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={modelId} 
                onChange={(e) => setModelId(e.target.value)}
                placeholder="llama3:8b"
                className="pl-10 border-white/10 bg-white/5"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStart} 
            disabled={!baseUrl || !modelId || isTesting}
            className="w-full h-12 rounded-xl bg-primary text-accent hover:scale-[1.02] transition-transform"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating Connection...
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
