import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatCAD } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

type SearchParams = Promise<{
  batch?: string;
  payment?: string;
}>;

async function getOrders(filters: { batch?: string; payment?: string }) {
  const sb = supabaseAdmin();
  let query = sb
    .from("orders")
    .select("*, order_items(quantity)")
    .order("created_at", { ascending: false });
  if (filters.batch) query = query.eq("batch_label", filters.batch);
  if (filters.payment) query = query.eq("payment_method", filters.payment);
  const { data } = await query;
  return data ?? [];
}

async function getBatchLabels() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("orders")
    .select("batch_label")
    .not("batch_label", "is", null);
  const unique = new Set<string>();
  for (const row of data ?? []) {
    if (row.batch_label) unique.add(row.batch_label);
  }
  return Array.from(unique).sort();
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters = {
    batch: sp.batch,
    payment: sp.payment,
  };
  const [orders, batches] = await Promise.all([getOrders(filters), getBatchLabels()]);

  return (
    <div>
      <h1 className="font-display font-bold text-navy text-2xl sm:text-3xl mb-6">
        Orders
      </h1>

      {/* Filters */}
      <Card className="mb-6">
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="eyebrow text-navy block mb-1">Batch</label>
            <select
              name="batch"
              defaultValue={filters.batch ?? ""}
              className="h-10 rounded-xs border border-navy/15 px-3 text-sm bg-white"
            >
              <option value="">All</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="eyebrow text-navy block mb-1">Payment</label>
            <select
              name="payment"
              defaultValue={filters.payment ?? ""}
              className="h-10 rounded-xs border border-navy/15 px-3 text-sm bg-white"
            >
              <option value="">All</option>
              <option value="etransfer">E-Transfer</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <button
            type="submit"
            className="eyebrow h-10 px-4 rounded-sm bg-navy text-white hover:bg-navy-deep transition-colors"
          >
            Apply
          </button>
          {(filters.batch || filters.payment) && (
            <Link
              href="/admin/orders"
              className="eyebrow text-muted hover:text-red-deep self-center"
            >
              Clear
            </Link>
          )}
        </form>
      </Card>

      {orders.length === 0 ? (
        <Card>
          <p className="text-muted text-center py-10">No orders match these filters.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy/5 text-navy">
              <tr>
                <th className="eyebrow text-left px-4 py-3">Order</th>
                <th className="eyebrow text-left px-4 py-3 hidden sm:table-cell">Customer</th>
                <th className="eyebrow text-left px-4 py-3 hidden md:table-cell">Payment</th>
                <th className="eyebrow text-left px-4 py-3 hidden md:table-cell">Items</th>
                <th className="eyebrow text-right px-4 py-3">Total</th>
                <th className="eyebrow text-right px-4 py-3 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const itemCount = (o.order_items ?? []).reduce(
                  (s: number, i: { quantity: number }) => s + i.quantity,
                  0
                );
                return (
                  <tr
                    key={o.id}
                    className="border-t border-navy/5 hover:bg-cream/50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-display font-semibold text-navy hover:text-red"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-navy">{o.customer_name}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Pill tone={o.payment_method === "etransfer" ? "navy" : "cream"}>
                        {o.payment_method === "etransfer" ? "E-Transfer" : "Cash"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-navy">{itemCount}</td>
                    <td className="px-4 py-3 text-right font-display font-semibold text-red">
                      {formatCAD(o.subtotal_cents)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted text-xs hidden sm:table-cell">
                      {new Date(o.created_at).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
