"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function ProductImageGallery({
  images,
  productName,
}: {
  images: { id: string; url: string }[];
  productName: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-md bg-cream flex items-center justify-center text-navy/30 font-display text-4xl">
        BWM
      </div>
    );
  }

  const active = images[activeIdx] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square rounded-md overflow-hidden bg-cream">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={cn(
                "aspect-square rounded-xs overflow-hidden border transition-all",
                idx === activeIdx
                  ? "border-navy ring-2 ring-navy/30"
                  : "border-navy/10 opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
