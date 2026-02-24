
"use client";

import React, { useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Database, Zap, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"));
  }, [db]);

  const { data: users, loading: usersLoading } = useCollection(usersQuery);

  if (authLoading || usersLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-12 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-900">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Command Center</h1>
              <p className="text-slate-500 text-sm">Secure Neural Node Management</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary py-1 px-4 rounded-full">
            <Shield size={12} className="mr-2" />
            System Administrator
          </Badge>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-slate-200 shadow-2xl rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Users</CardTitle>
              <Users size={16} className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users?.length || 0}</div>
              <p className="text-[10px] text-slate-500 mt-1">Authenticated profiles in cloud</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-2xl rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Active Nodes</CardTitle>
              <Zap size={16} className="text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1</div>
              <p className="text-[10px] text-slate-500 mt-1">Primary engine connected</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-2xl rounded-[2rem]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Cloud Integrity</CardTitle>
              <Database size={16} className="text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">OPTIMAL</div>
              <p className="text-[10px] text-slate-500 mt-1">Firestore operational</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-100">
            <CardTitle className="text-xl font-bold">User Registry</CardTitle>
            <CardDescription className="text-slate-500">Real-time synchronization with Firebase Firestore</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Email Identifier</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8">Unique ID (UID)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-4 px-8 text-right">Access Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((u: any) => (
                    <TableRow key={u.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium py-4 px-8 text-sm">{u.email}</TableCell>
                      <TableCell className="font-mono text-[10px] text-slate-400 py-4 px-8">{u.id}</TableCell>
                      <TableCell className="text-right py-4 px-8">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg",
                          u.role === 'Admin' ? "border-primary/20 text-primary bg-primary/5" : "border-slate-200 text-slate-400"
                        )}>
                          {u.role || 'User'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-20 text-slate-400">
                      No user records found in the current cloud node.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
