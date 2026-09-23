"use client";

import { useEffect, useState } from "react";
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
    checkSession,
    checkPinSession,
    user,
    touchPinSession,
  } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [pinExpired, setPinExpired] = useState(false);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Remove a previously persisted bearer token from older dashboard versions.
  useEffect(() => { localStorage.removeItem("auth-storage"); }, []);

  useEffect(() => {
    const onSessionExpired = () => useAuthStore.setState({ user: null, isAuthenticated: false, isPinVerified: false, pinExpiresAt: null });
    const onPinExpired = () => { setPinExpired(true); useAuthStore.setState({ isPinVerified: false, pinExpiresAt: null }); };
    window.addEventListener("dashboard:session-expired", onSessionExpired);
    window.addEventListener("dashboard:pin-session-expired", onPinExpired);
    return () => { window.removeEventListener("dashboard:session-expired", onSessionExpired); window.removeEventListener("dashboard:pin-session-expired", onPinExpired); };
  }, []);

  // Validate the HTTP-only login and restore only a still-valid server-side PIN unlock after refresh.
  useEffect(() => {
    let active = true;
    setLoading(true);
    checkSession().finally(() => {
      if (active) {
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [checkSession]);

  // Ten-minute rolling PIN unlock; activity renews the server session as well.
  useEffect(() => {
    if (!isAuthenticated || !isPinVerified) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    let timerId: NodeJS.Timeout;
    let lastReset = Date.now();
    let lastServerTouch = Date.now();
    let touchPending = false;

    const resetTimer = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        setPinExpired(true);
        useAuthStore.setState({ isPinVerified: false, pinExpiresAt: null });
      }, INACTIVITY_TIMEOUT_MS);
    };

    resetTimer();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "pointerdown"];

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > 1000) {
        lastReset = now;
        resetTimer();
        if (now - lastServerTouch >= 2 * 60 * 1000 && !touchPending) {
          touchPending = true;
          touchPinSession()
            .then(() => { lastServerTouch = Date.now(); })
            .catch(() => { useAuthStore.setState({ isPinVerified: false, pinExpiresAt: null }); })
            .finally(() => { touchPending = false; });
        }
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        if (now - lastReset >= INACTIVITY_TIMEOUT_MS) {
          setPinExpired(true);
          useAuthStore.setState({ isPinVerified: false, pinExpiresAt: null });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerId) clearTimeout(timerId);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, isPinVerified, touchPinSession]);

  // Handle routing in a useEffect to prevent state updates during render
  useEffect(() => {
    if (loading) return;

    if (isPublicPath) {
      if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
        router.replace("/");
      }
    } else if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isPublicPath, isAuthenticated, pathname, router]);

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
    if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
      return null;
    }
    return <>{children}</>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated but no PIN set → show PIN setup
  if (user && user.hasPin === false) {
    return <PinSetupScreen />;
  }

  // Authenticated, has PIN, but PIN session not valid → show PIN unlock
  if (!isPinVerified || !checkPinSession()) {
    return <PinUnlockScreen expired={pinExpired} />;
  }

  // All checks passed
  return <>{children}</>;
}
