import { supabaseAnonServer } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StatusPill } from "@/components/storefront/StatusPill";
import type { ProductWithRelations, PublicSettings } from "@/types";

export const revalidate = 30;

async function getStorefrontData() {
  const sb = supabaseAnonServer();
  const [settingsRes, productsRes] = await Promise.all([
    sb.rpc("public_settings"),
    sb
      .from("products")
      .select("*, product_images(*), product_sizes(*)")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  const settingsRow = Array.isArray(settingsRes.data) ? settingsRes.data[0] : null;
  const settings: PublicSettings = settingsRow ?? {
    ordering_open: false,
    ordering_window_label: null,
    etransfer_email: null,
  };

  const products: ProductWithRelations[] = (productsRes.data ?? []) as ProductWithRelations[];
  return { settings, products };
}

export default async function HomePage() {
  const { settings, products } = await getStorefrontData();

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <p className="eyebrow text-red mb-4">Pre-order interest</p>
          <h1
            className="font-display font-bold text-white text-4xl sm:text-6xl leading-none"
            style={{ letterSpacing: "-0.02em" }}
          >
            BRYCE WAGE
            <br />
            <span className="text-red">MOTOCROSS</span>
          </h1>
          <p className="mt-6 max-w-xl text-white/70 text-base sm:text-lg leading-relaxed">
            Limited drops of motocross-inspired apparel.
            Tell us what you want, we'll order it, you pay when it arrives.
          </p>
          <div className="mt-8">
            <StatusPill
              open={settings.ordering_open}
              label={settings.ordering_window_label}
            />
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display font-semibold text-navy text-2xl sm:text-3xl">
            The Drop
          </h2>
          {!settings.ordering_open && (
            <p className="text-xs text-muted">Browse anytime — checkout reopens when the next window opens.</p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="rounded-md border border-navy/10 bg-cream p-12 text-center">
            <p className="font-display text-lg text-navy mb-2">No products yet</p>
            <p className="text-sm text-muted">
              Bryce hasn't published anything for this batch. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
