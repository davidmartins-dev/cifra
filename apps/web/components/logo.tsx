import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  asLink?: boolean;
  href?: string;
}

const sizeClasses = {
  sm: "text-lg tracking-tight",
  md: "text-2xl tracking-tight",
  lg: "text-3xl tracking-tight",
  xl: "text-4xl tracking-tighter",
};

export function Logo({
  size = "md",
  asLink = true,
  href = "/",
  className,
  ...props
}: LogoProps) {
  const content = (
    <span
      className={cn(
        "font-extrabold select-none transition-opacity hover:opacity-95 text-foreground inline-flex items-center",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      Cifra
      <span className="text-emerald-500 transition-transform duration-300 hover:scale-110">
        .
      </span>
    </span>
  );

  if (asLink) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
