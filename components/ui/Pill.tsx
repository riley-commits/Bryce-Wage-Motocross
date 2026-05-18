import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "navy" | "red" | "cream" | "white" | "muted";

const toneClasses: Record<Tone, string> = {
  navy: "bg-navy text-white",
  red: "bg-red/10 text-red-deep border border-red/20",
  cream: "bg-cream text-navy border border-navy/10",
  white: "bg-white text-navy border border-navy/15",
  muted: "bg-navy/5 text-muted",
};

export function Pill({
  tone = "navy",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center px-2.5 py-1 rounded-sm whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
