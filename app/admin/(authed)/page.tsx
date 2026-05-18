import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatCAD } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { OrderingToggle } from "@/components/admin/OrderingToggle";

async function getDashboardData() {
  const sb = supabaseAdmin();
  const [settings, ordersRes, batchOrdersRes] = await Promise.all([
    sb.from("settings").select("*").limit(1).maybeSingle(),
    sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(10),
    sb.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
  ]);

  const currentBatch = settings.data?.ordering_window_label ?? null;
  const batchOrders = currentBatch
    ? (batchOrdersRes.data ?? []).filter((o) => o.batch_label === currentBatch)
    : (batchOrdersRes.data ?? []);

  const totalValueCents = batchOrders.reduce<number>(
    (sum, o) => sum + (o.subtotal_cents ?? 0),
    0
  );

  // Top requested products with size breakdown.
  const productTally = new Map<
    string,
    { name: string; total: number; sizes: Map<string, number> }
  >();
  for (const o of batchOrders) {
    for (const item of o.order_items ?? []) {
      const key = item.product_name_snapshot;
      const existing = productTally.get(key) ?? {
        name: key,
        total: 0,
        sizes: new Map(),
      };
      existing.total += item.quantity;
      existing.sizes.set(
        item.size_label,
        (existing.sizes.get(item.size_label) ?? 0) + item.quantity
      );
      productTally.set(key, existing);
    }
  }
  const topProducts = Array.from(productTally.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    settings: settings.data,
    batchOrders,
    totalValueCents,
    topProducts,
    recentOrders: ordersRes.data ?? [],
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const orderingOpen = data.settings?.ordering_open ?? false;
  const batchLabel = data.settings?.ordering_window_label ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-navy text-2xl sm:text-3xl">
          Dashboard
        </h1>
        <Pill tone={orderingOpen ? "red" : "navy"}>
          {orderingOpen ? "Ordering Open" : "Ordering Closed"}
        </Pill>
      </div>

      {/* Ordering toggle */}
      <Card className="mb-6">
        <h2 className="eyebrow text-navy mb-3">Current Batch</h2>
        <p className="text-sm text-muted mb-3">
          {batchLabel || (
            <span className="italic">
              No batch label set —{" "}
              <Link href="/admin/settings" className="text-red underline">
                set one in settings
              </Link>
            </span>
          )}
        </p>
        <OrderingToggle initial={orderingOpen} />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="eyebrow text-muted mb-1">Orders this batch</p>
          <p className="font-display font-bold text-navy text-3xl">
            {data.batchOrders.length}
          </p>
        </Card>
        <Card>
          <p className="eyebrow text-muted mb-1">Total interest value</p>
          <p className="font-display font-bold text-red text-3xl">
            {formatCAD(data.totalValueCents)}
          </p>
        </Card>
        <Card>
          <p className="eyebrow text-muted mb-1">Items requested</p>
          <p className="font-display font-bold text-navy text-3xl">
            {data.batchOrders.reduce<number>(
              (s, o) =>
                s +
                ((o.order_items as { quantity: number }[] | null)?.reduce<number>(
                  (x, i) => x + i.quantity,
                  0
                ) ?? 0),
              0
            )}
          </p>
        </Card>
      </div>

      {/* Top products */}
      <Card className="mb-8">
        <h2 className="eyebrow text-navy mb-4">Top Requested — Current Batch</h2>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-muted">No orders yet in this batch.</p>
        ) : (
          <ul className="space-y-3">
            {data.topProducts.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-4 py-2 border-b border-navy/5 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy">{p.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {Array.from(p.sizes.entries())
                      .map(([size, count]) => `${size}: ${count}`)
                      .join(" · ")}
                  </p>
                </div>
                <span className="font-display font-bold text-red text-lg">
                  {p.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Recent orders */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="eyebrow text-navy">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs eyebrow text-red hover:underline"
          >
            View all →
          </Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-navy/5">
            {data.recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between py-3 hover:bg-navy/5 -mx-2 px-2 rounded-xs transition-colors"
                >
                  <div>
                    <p className="font-display font-semibold text-navy">
                      {o.order_number}
                    </p>
                    <p className="text-xs text-muted">{o.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-semibold text-red">
                      {formatCAD(o.subtotal_cents)}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(o.created_at).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
