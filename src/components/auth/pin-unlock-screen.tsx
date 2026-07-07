"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Loader2, Lock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinUnlockScreenProps {
  expired?: boolean;
}

export function PinUnlockScreen({ expired = false }: PinUnlockScreenProps) {
  const [pin, setPin] = useState("");
  const { verifyPin, isLoading, user } = useAuthStore();
  const [error, setError] = useState(false);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4 && !isLoading) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (!isLoading) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKeyPress(e.key);
      if (e.key === "Backspace") handleDelete();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, isLoading]);

  useEffect(() => {
    if (pin.length === 4) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = async () => {
    try {
      setError(false);
      await verifyPin(pin);
    } catch {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className={cn(
        "flex flex-col items-center space-y-12 max-w-sm w-full transition-all duration-300",
        error ? "animate-shake" : ""
      )}>
        {/* User avatar + header */}
        <div className="flex flex-col items-center space-y-4 text-center">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="size-16 rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
              {isLoading ? <Loader2 className="size-8 animate-spin" /> : <Lock className="size-8" />}
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            {expired ? "Session Expired" : "Security Check"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {expired ? (
              <span className="flex items-center gap-1.5">
                <Timer className="size-3.5" />
                Your 1-hour session has expired. Re-enter PIN.
              </span>
            ) : (
              `Enter your 4-digit PIN to access your workspace.`
            )}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "size-4 rounded-full border-2 transition-all duration-300",
                pin.length > i
                  ? "bg-primary border-primary scale-125 shadow-lg shadow-primary/20"
                  : "bg-transparent border-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6 w-full px-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit.toString())}
              disabled={isLoading}
              className="size-16 rounded-full flex items-center justify-center text-2xl font-medium border border-border/50 bg-card/50 hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-primary/20"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress("0")}
            disabled={isLoading}
            className="size-16 rounded-full flex items-center justify-center text-2xl font-medium border border-border/50 bg-card/50 hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-primary/20"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="size-16 rounded-full flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      <footer className="absolute bottom-12 text-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-xs font-medium uppercase tracking-widest">Premium Workspace Dashboard</p>
      </footer>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
