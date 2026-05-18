"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCAD } from "@/lib/currency";
import { browserProductImageUrl } from "@/lib/supabase/browser";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { LinkButton } from "@/components/ui/Button";
import type { PublicSettings } from "@/types";

export default function CartPage() {
  const { lines, hydrated, subtotalCents, updateQuantity, removeLine } = useCart();
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  useEffect(() => {
    // Fetch open/closed status to disable checkout button if closed.
    fetch("/api/settings/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => setSettings({ ordering_open: false, ordering_window_label: null, etransfer_email: null }));
  }, []);

  const orderingOpen = settings?.ordering_open ?? false;
  const empty = hydrated && lines.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display font-bold text-navy text-3xl sm:text-4xl mb-2">Your Cart</h1>
      <p className="text-sm text-muted mb-8">
        Items here are interest only — you won't be charged. Bryce will follow up after the window closes.
      </p>

      {!hydrated ? (
        <p className="text-muted">Loading cart...</p>
      ) : empty ? (
        <div className="rounded-md border border-navy/10 bg-cream p-12 text-center">
          <p className="font-display text-lg text-navy mb-2">Your cart is empty</p>
          <p className="text-sm text-muted mb-6">Head back to the storefront and find something you like.</p>
          <LinkButton href="/" variant="primary">Browse Products</LinkButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          <ul className="flex flex-col divide-y divide-navy/10 rounded-md border border-navy/10 bg-white">
            {lines.map((line) => {
              const imgUrl = browserProductImageUrl(line.image_path);
              return (
                <li
                  key={`${line.product_id}::${line.size_label}`}
                  className="flex gap-4 p-4 sm:p-5"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xs bg-cream overflow-hidden shrink-0">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={line.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-navy/30 font-display">BWM</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-navy">{line.product_name}</p>
                    <p className="eyebrow text-muted mt-1">Size {line.size_label}</p>
                    <p className="font-display font-semibold text-red mt-1">{formatCAD(line.unit_price_cents)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(q) => updateQuantity(line.product_id, line.size_label, q)}
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(line.product_id, line.size_label)}
                        className="eyebrow text-muted hover:text-red-deep transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="rounded-md border border-navy/10 bg-white p-5 h-fit sticky top-20">
            <h2 className="eyebrow text-navy mb-4">Summary</h2>
            <div className="flex justify-between items-baseline mb-6">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="font-display font-semibold text-red text-xl">{formatCAD(subtotalCents)}</span>
            </div>
            <LinkButton
              href="/checkout"
              size="lg"
              className="w-full"
              {...(!orderingOpen ? { "aria-disabled": true } : {})}
              title={!orderingOpen ? "Ordering window is closed" : undefined}
              style={
                !orderingOpen
                  ? { opacity: 0.4, pointerEvents: "none" }
                  : undefined
              }
            >
              {orderingOpen ? "Continue to Checkout" : "Ordering Closed"}
            </LinkButton>
            <p className="mt-4 text-xs text-muted">
              No payment processed online. After Bryce closes the window, he'll contact you to arrange e-transfer or cash.
            </p>
            <p className="mt-4 text-xs text-center">
              <Link href="/" className="text-navy/60 hover:text-navy">← Keep browsing</Link>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
