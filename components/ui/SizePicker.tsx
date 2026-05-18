"use client";

import { cn } from "@/lib/cn";

export function SizePicker({
  sizes,
  value,
  onChange,
  disabled,
}: {
  sizes: { id: string; label: string }[];
  value: string | null;
  onChange: (label: string) => void;
  disabled?: boolean;
}) {
  if (sizes.length === 0) {
    return <p className="text-sm text-muted">No sizes available</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((s) => {
        const selected = value === s.label;
        return (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s.label)}
            className={cn(
              "eyebrow px-3 h-9 rounded-sm border transition-colors",
              selected
                ? "bg-navy text-white border-navy"
                : "bg-white text-navy border-navy/20 hover:border-navy",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
