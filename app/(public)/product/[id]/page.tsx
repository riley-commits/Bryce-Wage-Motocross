import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAnonServer, productImageUrl } from "@/lib/supabase/server";
import { formatCAD } from "@/lib/currency";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { AddToCartForm } from "@/components/storefront/AddToCartForm";
import type { ProductWithRelations, PublicSettings } from "@/types";

export const revalidate = 30;

async function getProduct(id: string) {
  const sb = supabaseAnonServer();
  const [productRes, settingsRes] = await Promise.all([
    sb
      .from("products")
      .select("*, product_images(*), product_sizes(*)")
      .eq("id", id)
      .eq("active", true)
      .maybeSingle(),
    sb.rpc("public_settings"),
  ]);

  const product = (productRes.data ?? null) as ProductWithRelations | null;
  const settingsRow = Array.isArray(settingsRes.data) ? settingsRes.data[0] : null;
  const settings: PublicSettings = settingsRow ?? {
    ordering_open: false,
    ordering_window_label: null,
    etransfer_email: null,
  };

  return { product, settings };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product, settings } = await getProduct(id);
  if (!product) notFound();

  const images = product.product_images
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({ id: img.id, url: productImageUrl(img.storage_path)! }))
    .filter((img) => !!img.url);

  const sizes = product.product_sizes
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((s) => ({ id: s.id, label: s.label }));

  const primaryImagePath =
    product.product_images
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <Link href="/" className="text-sm text-navy/70 hover:text-navy">
          ← Back to products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <ProductImageGallery images={images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display font-bold text-navy text-3xl sm:text-4xl leading-tight mb-3">
              {product.name}
            </h1>
            <p className="font-display font-semibold text-red text-2xl">
              {formatCAD(product.price_cents)}
            </p>
          </div>

          {product.description && (
            <p className="text-ink/80 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          <hr className="hairline border-t" />

          <AddToCartForm
            productId={product.id}
            productName={product.name}
            unitPriceCents={product.price_cents}
            sizes={sizes}
            primaryImagePath={primaryImagePath}
            orderingOpen={settings.ordering_open}
          />

          {!settings.ordering_open && (
            <p className="text-xs text-muted">
              Ordering is closed. You can still browse — checkout reopens when Bryce starts the next batch.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
