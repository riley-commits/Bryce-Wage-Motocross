import Link from "next/link";
import { supabaseAdmin, productImageUrl } from "@/lib/supabase/server";
import { formatCAD } from "@/lib/currency";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

async function getAllProducts() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("products")
    .select("*, product_images(storage_path, sort_order)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-navy text-2xl sm:text-3xl">
          Products
        </h1>
        <LinkButton href="/admin/products/new">+ New Product</LinkButton>
      </div>

      {products.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-10">
            No products yet.{" "}
            <Link href="/admin/products/new" className="text-red underline">
              Create your first one.
            </Link>
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy/5 text-navy">
              <tr>
                <th className="eyebrow text-left px-4 py-3">Product</th>
                <th className="eyebrow text-left px-4 py-3 hidden sm:table-cell">Price</th>
                <th className="eyebrow text-left px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="eyebrow text-right px-4 py-3">Edit</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const primary = ((p.product_images ?? []) as { storage_path: string; sort_order: number }[])
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)[0];
                const imgUrl = productImageUrl(primary?.storage_path);
                return (
                  <tr key={p.id} className="border-t border-navy/5 hover:bg-cream/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xs bg-cream overflow-hidden shrink-0">
                          {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-navy/30 text-xs font-display">
                              BWM
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-navy">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-navy">
                      {formatCAD(p.price_cents)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Pill tone={p.active ? "red" : "muted"}>
                        {p.active ? "Active" : "Archived"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="eyebrow text-red hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
