"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { itemCount, hydrated } = useCart();
  return (
    <header className="bg-navy text-white border-b border-white/5 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <span
            className="font-display font-bold text-white tracking-tight text-lg sm:text-xl"
            style={{ letterSpacing: "-0.01em" }}
          >
            BRYCE WAGE <span className="text-red">MOTOCROSS</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 px-3 h-9 rounded-sm border border-white/20 text-white hover:bg-white hover:text-navy transition-colors eyebrow text-xs"
          >
            <span>Cart</span>
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-sm bg-red text-white text-[10px] font-semibold">
              {hydrated ? itemCount : 0}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
