import Link from "next/link";
import { Pill } from "@/components/ui/Pill";
import { formatCAD } from "@/lib/currency";
import { productImageUrl } from "@/lib/supabase/server";
import type { ProductWithRelations } from "@/types";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const primaryImage = product.product_images
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  const imageUrl = productImageUrl(primaryImage?.storage_path);
  const sizes = product.product_sizes
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block rounded-md overflow-hidden border border-navy/10 bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      <div className="aspect-[4/5] bg-cream relative overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-navy/30 font-display text-2xl">
            BWM
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-navy text-lg leading-tight mb-1">
          {product.name}
        </h3>
        <p className="text-red font-display font-semibold mb-3">
          {formatCAD(product.price_cents)}
        </p>
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <Pill key={s.id} tone="cream" className="text-[10px]">
                {s.label}
              </Pill>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
