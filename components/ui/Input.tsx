import * as React from "react";
import { cn } from "@/lib/cn";

const fieldClasses =
  "block w-full rounded-xs border border-navy/15 bg-white px-3 py-2.5 text-sm text-ink " +
  "placeholder:text-muted shadow-sm transition-colors focus:border-navy focus:outline-none " +
  "focus:ring-2 focus:ring-navy/15 disabled:bg-cream disabled:text-muted";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(fieldClasses, className)} {...rest} />;
  }
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(fieldClasses, "min-h-24 resize-y", className)}
        {...rest}
      />
    );
  }
);

export function Label({
  className,
  children,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("eyebrow block mb-1.5 text-navy", className)}
      {...rest}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-xs text-red-deep font-medium">{children}</p>
  );
}

export function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-muted">{children}</p>;
}
