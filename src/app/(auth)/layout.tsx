import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in or create your account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {children}
      </div>

      {/* Branding footer */}
      <footer className="absolute bottom-6 text-center w-full opacity-30 hover:opacity-60 transition-opacity">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
          Premium Workspace Dashboard
        </p>
      </footer>
    </div>
  );
}
