"use client";

import { useEffect, useState, useCallback } from "react";
import type { CartLine } from "@/types";

const STORAGE_KEY = "bwm_cart_v1";

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("bwm-cart-change"));
}

function lineKey(l: Pick<CartLine, "product_id" | "size_label">) {
  return `${l.product_id}::${l.size_label}`;
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(read());
    setHydrated(true);
    const handler = () => setLines(read());
    window.addEventListener("bwm-cart-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("bwm-cart-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const addLine = useCallback((incoming: CartLine) => {
    const existing = read();
    const key = lineKey(incoming);
    const match = existing.find((l) => lineKey(l) === key);
    let next: CartLine[];
    if (match) {
      next = existing.map((l) =>
        lineKey(l) === key ? { ...l, quantity: l.quantity + incoming.quantity } : l
      );
    } else {
      next = [...existing, incoming];
    }
    write(next);
  }, []);

  const updateQuantity = useCallback(
    (product_id: string, size_label: string, quantity: number) => {
      const existing = read();
      const next = existing
        .map((l) =>
          l.product_id === product_id && l.size_label === size_label
            ? { ...l, quantity }
            : l
        )
        .filter((l) => l.quantity > 0);
      write(next);
    },
    []
  );

  const removeLine = useCallback((product_id: string, size_label: string) => {
    const existing = read();
    const next = existing.filter(
      (l) => !(l.product_id === product_id && l.size_label === size_label)
    );
    write(next);
  }, []);

  const clear = useCallback(() => write([]), []);

  const subtotalCents = lines.reduce(
    (sum, l) => sum + l.unit_price_cents * l.quantity,
    0
  );
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return {
    lines,
    hydrated,
    addLine,
    updateQuantity,
    removeLine,
    clear,
    subtotalCents,
    itemCount,
  };
}

export function clearCart() {
  if (typeof window !== "undefined") write([]);
}
