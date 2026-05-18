"use client";

import { cn } from "@/lib/cn";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  function clamp(n: number) {
    return Math.max(min, Math.min(max, n));
  }

  return (
    <div
      className={cn(
        "inline-flex items-stretch h-10 rounded-sm border border-navy/15 overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(clamp(value - 1))}
        className="px-3 text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40"
        disabled={value <= min}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value || `${min}`, 10) || min))}
        className="w-12 text-center text-sm bg-white text-ink focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(clamp(value + 1))}
        className="px-3 text-navy hover:bg-navy hover:text-white transition-colors disabled:opacity-40"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
