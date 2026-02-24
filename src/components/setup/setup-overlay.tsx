"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Server, Cpu, Loader2, AlertCircle, Key, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import { testConnectionAction, fetchModelsAction } from "@/ai/actions/engine-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function SetupOverlay() {
  const { completeInitialSetup } = useAppStore();
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434/v1");
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setIsTesting(true);
    try {
      const isOnline = await testConnectionAction(baseUrl, apiKey);
      if (isOnline) {
        const fetchedModels = await fetchModelsAction(baseUrl, apiKey);
        setModels(fetchedModels.map(m => m.id));
        setIsVerified(true);
        if (fetchedModels.length > 0) {
          setModelId(fetchedModels[0].id);
        }
      } else {
        setError("Node handshake failed. Verify URL and Access Secret.");
      }
    } catch (err) {
      setError("Signal integrity failure. Check firewall and network.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleFinalize = async () => {
    setError(null);
    setIsTesting(true);
    try {
      const success = await completeInitialSetup(baseUrl, modelId || "unspecified", apiKey);
      if (!success) {
        setError("Finalization protocol rejected. Node may have timed out.");
      }
    } catch (err) {
      setError("Finalization protocol error.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-3xl p-4 overflow-hidden">
      {/* Animated Text Logo */}
      <div className="mb-6 text-center animate-in fade-in slide-in-from-top-4 duration-1000 shrink-0">
        <h1 className="logo-shimmer font-headline text-5xl sm:text-7xl font-black tracking-tighter leading-none select-none">
          ZEROGPT
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-slate-400 mt-2 animate-pulse">
          Neural Command Hub
        </p>
      </div>

      <div className="w-full max-w-sm animate-in fade-in zoom-in duration-500">
        <Card className="border-none bg-white shadow-[0_40px_120px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <Zap size={28} fill="currentColor" className={isTesting ? "animate-pulse" : ""} />
            </div>
            <CardTitle className="font-headline text-2xl font-bold tracking-tight text-slate-900">Energize Node</CardTitle>
            <CardDescription className="text-[9px] uppercase font-black tracking-widest text-primary mt-1">HANDSHAKE REQUIRED</CardDescription>
            
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <Badge variant="outline" className="h-5 text-[7px] uppercase font-bold px-2 border-slate-100 bg-slate-50 text-slate-400">
                <ShieldCheck size={10} className="mr-1" /> Secure
              </Badge>
              <Badge variant="outline" className="h-5 text-[7px] uppercase font-bold px-2 border-slate-100 bg-slate-50 text-slate-400">
                <Server size={10} className="mr-1" /> Local
              </Badge>
              <Badge variant="outline" className="h-5 text-[7px] uppercase font-bold px-2 border-slate-100 bg-slate-50 text-slate-400">
                <Cpu size={10} className="mr-1" /> Neural
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-8">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[10px] font-bold uppercase leading-tight">{error}</p>
              </div>
            )}

            {!isVerified ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Endpoint Node</Label>
                  <div className="relative">
                    <Server className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <Input 
                      value={baseUrl} 
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl text-xs font-mono focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Secret (Optional)</Label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <Input 
                      type="password"
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl text-xs font-mono focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-600">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Node Signal Synchronized</span>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Model Identifier</Label>
                  <div className="relative">
                    <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 z-10" size={14} />
                    {models.length > 0 ? (
                      <Select value={modelId} onValueChange={setModelId}>
                        <SelectTrigger className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl text-xs font-bold focus:ring-primary/20">
                          <SelectValue placeholder="Select indexed model" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 z-[200]">
                          {models.map(m => (
                            <SelectItem key={m} value={m} className="text-xs font-bold">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        value={modelId} 
                        onChange={(e) => setModelId(e.target.value)}
                        placeholder="llama3:8b"
                        className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl text-xs font-bold focus:ring-primary/20"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-4 pb-8 px-8">
            {!isVerified ? (
              <Button 
                onClick={handleVerify} 
                disabled={!baseUrl || isTesting}
                className="w-full h-12 rounded-xl bg-primary text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-primary/20 gap-2"
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Node Signal"}
                {!isTesting && <ChevronRight size={14} />}
              </Button>
            ) : (
              <div className="w-full flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsVerified(false)}
                  className="h-12 flex-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border-slate-100 text-slate-400 hover:bg-slate-50"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleFinalize} 
                  disabled={isTesting}
                  className="h-12 flex-[2] rounded-xl bg-emerald-600 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-105 transition-all shadow-xl shadow-emerald-200 gap-2"
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Energize Node"}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>

        <div className="mt-6 text-center opacity-60">
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-2">
            <span className="text-slate-400">Node crafted by</span>
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
