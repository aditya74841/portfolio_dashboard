"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await loginWithEmail(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) return;

    const initGoogle = () => {
      const { google } = window as any;
      if (!google || !googleButtonRef.current) return;

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential: string }) => {
          try {
            await loginWithGoogle(response.credential);
            router.push("/");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Google login failed");
          }
        },
      });

      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 320,
      });
    };

    if (typeof window !== "undefined") {
      if ((window as any).google) {
        initGoogle();
      } else {
        const interval = setInterval(() => {
          if ((window as any).google) {
            clearInterval(interval);
            initGoogle();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [loginWithGoogle, router]);


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 shadow-inner">
          <Lock className="size-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your workspace
        </p>
      </div>

      {/* Login Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-4 items-center flex justify-center">
          {/* Google Login Container */}
          <div ref={googleButtonRef} className="w-full flex justify-center" />
        </CardHeader>

        <div className="relative px-6">
          <div className="absolute inset-0 flex items-center px-6">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium tracking-wider">
              or
            </span>
          </div>
        </div>

        <CardContent className="pt-6">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-in fade-in duration-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Register Link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary font-semibold hover:text-primary/80 transition-colors underline underline-offset-4 decoration-primary/30"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
