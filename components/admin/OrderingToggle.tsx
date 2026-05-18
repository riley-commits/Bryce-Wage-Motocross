"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export function OrderingToggle({ initial }: { initial: boolean }) {
  const [open, setOpen] = useState(initial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function toggle() {
    setSaving(true);
    const next = !open;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordering_open: next }),
      });
      if (res.ok) {
        setOpen(next);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={cn(
          "relative inline-flex h-7 w-12 rounded-full transition-colors disabled:opacity-50",
          open ? "bg-red" : "bg-navy/30"
        )}
        aria-pressed={open}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform",
            open && "translate-x-5"
          )}
        />
      </button>
      <span className="eyebrow text-navy">
        {saving ? "Saving..." : open ? "Open — accepting orders" : "Closed"}
      </span>
    </div>
  );
}
