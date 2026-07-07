"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { PinUnlockScreen } from "@/components/auth/pin-unlock-screen";
import { PinSetupScreen } from "@/components/auth/pin-setup-screen";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isAuthenticated,
    isPinVerified,
    pinExpiresAt,
    checkSession,
    checkPinSession,
    checkPinSessionFromServer,
    user,
  } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pinExpired, setPinExpired] = useState(false);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Initial session check
  useEffect(() => {
    const init = async () => {
      if (isAuthenticated && hasPin === null) {
        setLoading(true);
        await checkSession();

        // Check PIN session from server
        const pinStatus = await checkPinSessionFromServer();
        setHasPin(pinStatus.hasPin);

        if (!pinStatus.isValid && pinStatus.hasPin) {
          setPinExpired(true);
        }
        setLoading(false);
      } else if (!isAuthenticated) {
        setLoading(false);
      }
    };

    init();
  }, [isAuthenticated, hasPin, checkSession, checkPinSessionFromServer]);

  // PIN expiry timer
  useEffect(() => {
    if (!pinExpiresAt || !isPinVerified) return;

    const timeLeft = pinExpiresAt - Date.now();
    if (timeLeft <= 0) {
      setPinExpired(true);
      useAuthStore.setState({ isPinVerified: false });
      return;
    }

    const timer = setTimeout(() => {
      setPinExpired(true);
      useAuthStore.setState({ isPinVerified: false });
    }, timeLeft);

    return () => clearTimeout(timer);
  }, [pinExpiresAt, isPinVerified]);

  // Listen for PIN verification changes
  useEffect(() => {
    if (isPinVerified) {
      setPinExpired(false);
      // Update hasPin since user just verified or set a PIN
      setHasPin(true);
    }
  }, [isPinVerified]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Public paths bypass auth
  if (isPublicPath) {
    // If already authenticated, redirect to home
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      router.push("/");
      return null;
    }
    return <>{children}</>;
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  // Authenticated but no PIN set → show PIN setup
  if (hasPin === false) {
    return <PinSetupScreen />;
  }

  // Authenticated, has PIN, but PIN session not valid → show PIN unlock
  if (!isPinVerified || !checkPinSession()) {
    return <PinUnlockScreen expired={pinExpired} />;
  }

  // All checks passed
  return <>{children}</>;
}
