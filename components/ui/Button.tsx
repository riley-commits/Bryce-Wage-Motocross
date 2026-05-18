import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-red text-white hover:bg-red-deep hover:-translate-y-px active:translate-y-0 focus-visible:outline-red",
  secondary:
    "border border-navy text-navy bg-transparent hover:bg-navy hover:text-white focus-visible:outline-navy",
  ghost:
    "text-navy hover:bg-navy/5 focus-visible:outline-navy",
  danger:
    "bg-red-deep text-white hover:bg-red focus-visible:outline-red",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-sm",
  md: "h-11 px-5 text-sm rounded-sm",
  lg: "h-12 px-6 text-base rounded-md",
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-wide uppercase " +
  "transition-all duration-150 ease-out focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 disabled:opacity-40 disabled:pointer-events-none";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: BaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
