"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Please enter your email."); return; }
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
        <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account with <span className="font-medium text-foreground">{email}</span> exists, we sent a reset link (expires in 15 min).
        </p>
        <Button variant="outline" onClick={() => { setSent(false); setEmail(""); }} className="w-full h-11">Send again</Button>
        <Link href="/login"><Button variant="ghost" className="w-full h-11 gap-2"><ArrowLeft className="size-4" />Back to sign in</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-4 shadow-inner"><Mail className="size-7" /></div>
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send a reset link.</p>
      </div>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-0" />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 bg-background/50" disabled={isLoading} autoFocus />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-semibold bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Link href="/login"><Button variant="ghost" className="w-full h-11 gap-2 text-muted-foreground"><ArrowLeft className="size-4" />Back to sign in</Button></Link>
    </div>
  );
}
