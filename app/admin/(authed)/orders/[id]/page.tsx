import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatCAD } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

async function getOrder(id: string) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const contactHref =
    order.contact_method === "email"
      ? `mailto:${order.contact_value}`
      : `tel:${order.contact_value}`;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/orders" className="text-sm text-navy/70 hover:text-navy">
          ← Back to orders
        </Link>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
        <div>
          <h1 className="font-display font-bold text-navy text-2xl sm:text-3xl">
            {order.order_number}
          </h1>
          <p className="text-xs text-muted mt-1">
            Placed {new Date(order.created_at).toLocaleString("en-CA")}
          </p>
        </div>
        <Pill tone={order.payment_method === "etransfer" ? "navy" : "cream"}>
          {order.payment_method === "etransfer" ? "E-Transfer" : "Cash"}
        </Pill>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <h2 className="eyebrow text-navy mb-4">Items</h2>
          <ul className="divide-y divide-navy/5">
            {order.order_items.map((item: { id: string; product_name_snapshot: string; size_label: string; quantity: number; unit_price_cents: number }) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between py-3"
              >
                <div>
                  <p className="font-medium text-navy">{item.product_name_snapshot}</p>
                  <p className="text-xs text-muted">
                    {item.size_label} · qty {item.quantity} · {formatCAD(item.unit_price_cents)} each
                  </p>
                </div>
                <p className="font-display font-semibold text-navy whitespace-nowrap">
                  {formatCAD(item.unit_price_cents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <hr className="hairline border-t mt-4 mb-4" />
          <div className="flex justify-between items-baseline">
            <span className="eyebrow text-navy">Subtotal</span>
            <span className="font-display font-bold text-red text-2xl">
              {formatCAD(order.subtotal_cents)}
            </span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="eyebrow text-navy mb-3">Customer</h2>
            <p className="font-medium text-navy">{order.customer_name}</p>
            <p className="text-sm mt-1">
              <a href={contactHref} className="text-red hover:underline">
                {order.contact_value}
              </a>
            </p>
            <p className="text-xs text-muted mt-1 capitalize">via {order.contact_method}</p>
          </Card>

          {order.notes && (
            <Card>
              <h2 className="eyebrow text-navy mb-2">Notes</h2>
              <p className="text-sm text-ink/80 whitespace-pre-line">{order.notes}</p>
            </Card>
          )}

          <Card>
            <h2 className="eyebrow text-navy mb-2">Batch</h2>
            <p className="text-sm text-ink/80">
              {order.batch_label ?? <span className="text-muted">No batch label</span>}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
