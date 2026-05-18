"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError, FieldHelp } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { dollarsToCents, centsToDollarsString } from "@/lib/currency";
import { ProductImageManager } from "./ProductImageManager";

export type ProductFormInitial = {
  id?: string;
  name: string;
  description: string | null;
  price_cents: number;
  active: boolean;
  sort_order: number;
  sizes: { id?: string; label: string; sort_order: number }[];
  images?: { id: string; storage_path: string; sort_order: number }[];
};

type Props = {
  initial?: ProductFormInitial;
};

export function ProductForm({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price_dollars: initial ? centsToDollarsString(initial.price_cents) : "",
    active: initial?.active ?? true,
    sort_order: initial?.sort_order ?? 0,
  });
  const [sizes, setSizes] = useState<{ label: string; sort_order: number }[]>(
    initial?.sizes && initial.sizes.length > 0
      ? initial.sizes.map((s) => ({ label: s.label, sort_order: s.sort_order }))
      : [{ label: "", sort_order: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSize() {
    setSizes((s) => [...s, { label: "", sort_order: s.length }]);
  }
  function removeSize(idx: number) {
    setSizes((s) => s.filter((_, i) => i !== idx).map((row, i) => ({ ...row, sort_order: i })));
  }
  function updateSize(idx: number, label: string) {
    setSizes((s) => s.map((row, i) => (i === idx ? { ...row, label } : row)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const priceCents = dollarsToCents(form.price_dollars);
    if (priceCents <= 0) {
      setError("Price must be greater than zero");
      setSaving(false);
      return;
    }
    const cleanSizes = sizes
      .map((s, i) => ({ label: s.label.trim(), sort_order: i }))
      .filter((s) => s.label.length > 0);
    if (cleanSizes.length === 0) {
      setError("Add at least one size");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_cents: priceCents,
      active: form.active,
      sort_order: Number(form.sort_order) || 0,
      sizes: cleanSizes,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Save failed");
        setSaving(false);
        return;
      }
      const id = isEdit ? initial!.id! : data.id;
      router.push(`/admin/products/${id}`);
      router.refresh();
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  async function archive() {
    if (!isEdit || !initial?.id) return;
    if (!confirm("Archive this product? It'll be hidden from the storefront. Past orders remain unaffected.")) return;
    const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h2 className="font-display font-semibold text-navy text-lg mb-4">Details</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
            <FieldHelp>Optional. Plain text — line breaks preserved.</FieldHelp>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (CAD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price_dollars}
                onChange={(e) => setForm({ ...form, price_dollars: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sort_order">Sort order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })}
              />
              <FieldHelp>Lower = shown earlier.</FieldHelp>
            </div>
            <div>
              <Label>Active</Label>
              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-red"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <span className="text-sm text-navy">
                  {form.active ? "Visible on storefront" : "Hidden"}
                </span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-navy text-lg">Sizes</h2>
          <button
            type="button"
            onClick={addSize}
            className="eyebrow text-red hover:underline"
          >
            + Add size
          </button>
        </div>
        <p className="text-xs text-muted mb-4">
          Add a row for each size you'll offer (e.g. S, M, L, XL, or 32x34). Order
          here = order shown to customers.
        </p>
        <ul className="space-y-2">
          {sizes.map((s, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="eyebrow text-muted w-6 shrink-0">#{idx + 1}</span>
              <Input
                value={s.label}
                onChange={(e) => updateSize(idx, e.target.value)}
                placeholder="e.g. M or 32x34"
              />
              <button
                type="button"
                onClick={() => removeSize(idx)}
                className="eyebrow text-muted hover:text-red-deep shrink-0 px-2"
                disabled={sizes.length === 1}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {isEdit && initial?.id && (
        <ProductImageManager
          productId={initial.id}
          initialImages={initial.images ?? []}
        />
      )}

      {!isEdit && (
        <Card>
          <p className="text-sm text-muted">
            Images can be uploaded after the product is saved.
          </p>
        </Card>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
          </Button>
          <FieldError>{error}</FieldError>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={archive}
            className="eyebrow text-muted hover:text-red-deep"
          >
            Archive
          </button>
        )}
      </div>
    </form>
  );
}
