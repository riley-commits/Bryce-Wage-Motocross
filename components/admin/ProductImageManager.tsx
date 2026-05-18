"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { browserProductImageUrl } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";

type Image = { id: string; storage_path: string; sort_order: number };

export function ProductImageManager({
  productId,
  initialImages,
}: {
  productId: string;
  initialImages: Image[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<Image[]>(
    initialImages.slice().sort((a, b) => a.sort_order - b.sort_order)
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Upload failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(id: string) {
    if (!confirm("Delete this image?")) return;
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_id: id }),
    });
    if (res.ok) {
      setImages((imgs) => imgs.filter((i) => i.id !== id));
      router.refresh();
    }
  }

  function onDragStart(idx: number) {
    setDragIdx(idx);
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setDragIdx(idx);
    setImages(next.map((img, i) => ({ ...img, sort_order: i })));
  }
  async function onDragEnd() {
    setDragIdx(null);
    await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: images.map((img, i) => ({ id: img.id, sort_order: i })),
      }),
    });
    router.refresh();
  }

  return (
    <Card>
      <h2 className="font-display font-semibold text-navy text-lg mb-1">Images</h2>
      <p className="text-xs text-muted mb-4">
        First image is the primary thumbnail. Drag to reorder.
      </p>

      {images.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
          {images.map((img, idx) => {
            const url = browserProductImageUrl(img.storage_path);
            return (
              <li
                key={img.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDragEnd={onDragEnd}
                className={cn(
                  "relative aspect-square rounded-xs bg-cream overflow-hidden border-2 cursor-move transition-all",
                  idx === 0 ? "border-red" : "border-transparent",
                  dragIdx === idx && "opacity-50"
                )}
              >
                {url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                {idx === 0 && (
                  <span className="absolute top-1 left-1 eyebrow text-[9px] bg-red text-white px-1.5 py-0.5 rounded-xs">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-xs bg-white/90 text-navy hover:bg-red hover:text-white text-xs"
                  aria-label="Delete image"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <label className="block">
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          className={cn(
            "border-2 border-dashed border-navy/20 rounded-md p-6 text-center cursor-pointer transition-colors",
            "hover:border-navy hover:bg-cream/50",
            uploading && "opacity-50 pointer-events-none"
          )}
        >
          <p className="eyebrow text-navy mb-1">
            {uploading ? "Uploading..." : "Click to add images"}
          </p>
          <p className="text-xs text-muted">JPEG / PNG / WebP — max 8 MB each</p>
        </div>
      </label>

      {error && <p className="mt-3 text-xs text-red-deep">{error}</p>}
    </Card>
  );
}
