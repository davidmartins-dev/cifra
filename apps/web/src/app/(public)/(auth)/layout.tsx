import * as React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-linear-to-b from-background via-muted/20 to-background p-4 sm:p-6">
      {/* Background Decorativo Sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-120 w-200 rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/5" />
      </div>

      {/* Conteúdo Centralizado */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
