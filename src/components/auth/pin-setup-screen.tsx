"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PinSetupScreen() {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const { setPin: savePinToServer, isLoading } = useAuthStore();
  const [error, setError] = useState(false);

  const currentPin = step === "create" ? pin : confirmPin;
  const setCurrentPin = step === "create" ? setPin : setConfirmPin;

  const handleKeyPress = (digit: string) => {
    if (currentPin.length < 4 && !isLoading) {
      setCurrentPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    if (!isLoading) {
      setCurrentPin((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKeyPress(e.key);
      if (e.key === "Backspace") handleDelete();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPin, isLoading, step]);

  useEffect(() => {
    if (step === "create" && pin.length === 4) {
      setStep("confirm");
    }
  }, [pin, step]);

  useEffect(() => {
    if (step === "confirm" && confirmPin.length === 4) {
      handleConfirm();
    }
  }, [confirmPin, step]);

  const handleConfirm = async () => {
    if (pin !== confirmPin) {
      setError(true);
      setConfirmPin("");
      setStep("create");
      setPin("");
      setTimeout(() => setError(false), 500);
      return;
    }
    try {
      setError(false);
      await savePinToServer(pin);
    } catch {
      setError(true);
      setPin("");
      setConfirmPin("");
      setStep("create");
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className={cn(
        "flex flex-col items-center space-y-12 max-w-sm w-full transition-all duration-300",
        error ? "animate-shake" : ""
      )}>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
            {isLoading ? <Loader2 className="size-8 animate-spin" /> : <ShieldCheck className="size-8" />}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {step === "create" ? "Set Your PIN" : "Confirm PIN"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === "create"
              ? "Choose a 4-digit PIN for quick access."
              : "Re-enter your PIN to confirm."}
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn(
              "size-4 rounded-full border-2 transition-all duration-300",
              currentPin.length > i
                ? "bg-emerald-500 border-emerald-500 scale-125 shadow-lg shadow-emerald-500/20"
                : "bg-transparent border-muted-foreground/30"
            )} />
          ))}
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          <div className={cn("h-1 w-8 rounded-full transition-colors", step === "create" ? "bg-emerald-500" : "bg-emerald-500/30")} />
          <div className={cn("h-1 w-8 rounded-full transition-colors", step === "confirm" ? "bg-emerald-500" : "bg-muted")} />
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6 w-full px-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button key={digit} onClick={() => handleKeyPress(digit.toString())} disabled={isLoading}
              className="size-16 rounded-full flex items-center justify-center text-2xl font-medium border border-border/50 bg-card/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-emerald-500/20"
            >{digit}</button>
          ))}
          <div />
          <button onClick={() => handleKeyPress("0")} disabled={isLoading}
            className="size-16 rounded-full flex items-center justify-center text-2xl font-medium border border-border/50 bg-card/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-emerald-500/20"
          >0</button>
          <button onClick={handleDelete} disabled={isLoading}
            className="size-16 rounded-full flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >Clear</button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 50% { transform: translateX(8px); } 75% { transform: translateX(-8px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}
