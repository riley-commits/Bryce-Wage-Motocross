import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";

async function getProduct(id: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("products")
    .select("*, product_images(*), product_sizes(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-navy/70 hover:text-navy">
          ← Back to products
        </Link>
      </div>
      <h1 className="font-display font-bold text-navy text-2xl sm:text-3xl mb-6">
        Edit Product
      </h1>
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          price_cents: product.price_cents,
          active: product.active,
          sort_order: product.sort_order,
          sizes: (product.product_sizes ?? [])
            .slice()
            .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
            .map((s: { id: string; label: string; sort_order: number }) => ({
              id: s.id,
              label: s.label,
              sort_order: s.sort_order,
            })),
          images: (product.product_images ?? [])
            .slice()
            .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
            .map((i: { id: string; storage_path: string; sort_order: number }) => ({
              id: i.id,
              storage_path: i.storage_path,
              sort_order: i.sort_order,
            })),
        }}
      />
    </div>
  );
}
