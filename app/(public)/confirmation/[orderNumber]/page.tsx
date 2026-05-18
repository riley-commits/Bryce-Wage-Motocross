import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formatCAD } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { LinkButton } from "@/components/ui/Button";
import { ClearCartOnMount } from "@/components/storefront/ClearCartOnMount";

// Service role read so we can look up by order_number. Public RLS on orders
// is insert-only. We deliberately omit customer name + contact from the
// rendered page so guessable order numbers don't leak PII.
async function getOrder(orderNumber: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("orders")
    .select("order_number, payment_method, subtotal_cents, batch_label, order_items(*)")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

async function getPublicSettings() {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("settings")
    .select("etransfer_email")
    .limit(1)
    .maybeSingle();
  return data ?? { etransfer_email: null };
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  const [order, settings] = await Promise.all([getOrder(decoded), getPublicSettings()]);
  if (!order) notFound();

  const totalStr = formatCAD(order.subtotal_cents);
  const etransferEmail = settings.etransfer_email || "(not set)";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <ClearCartOnMount />

      <div className="mb-8">
        <Pill tone="red">Interest Logged</Pill>
        <h1 className="font-display font-bold text-navy text-3xl sm:text-4xl mt-4 leading-tight">
          Thanks — your interest is logged.
        </h1>
        <p className="mt-4 text-muted">
          Your order number is{" "}
          <span className="font-display font-semibold text-navy text-lg">
            {order.order_number}
          </span>
          . Bryce will be in touch soon.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="eyebrow text-navy mb-4">Order Summary</h2>
        <ul className="space-y-3 mb-5 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between">
              <div>
                <p className="font-medium text-navy">
                  {item.product_name_snapshot}
                </p>
                <p className="text-xs text-muted">
                  {item.size_label} · qty {item.quantity}
                </p>
              </div>
              <p className="font-medium text-navy whitespace-nowrap">
                {formatCAD(item.unit_price_cents * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <hr className="hairline border-t mb-4" />
        <div className="flex justify-between items-baseline">
          <span className="eyebrow text-navy">Subtotal</span>
          <span className="font-display font-semibold text-red text-2xl">
            {totalStr}
          </span>
        </div>
      </Card>

      <div className="bg-navy text-white rounded-md p-6 mb-6">
        <h2 className="eyebrow text-red mb-3">Payment Instructions</h2>
        {order.payment_method === "etransfer" ? (
          <p className="text-white/90 leading-relaxed">
            Please send your e-transfer of{" "}
            <span className="font-display font-semibold text-white">{totalStr}</span>{" "}
            to{" "}
            <span className="font-display font-semibold text-white">{etransferEmail}</span>{" "}
            with order number{" "}
            <span className="font-display font-semibold text-white">{order.order_number}</span>{" "}
            in the message field. You can also choose to pay cash in person — just let Bryce know.
          </p>
        ) : (
          <p className="text-white/90 leading-relaxed">
            You've chosen to pay in person with cash. Bryce will be in touch to arrange.
            You can also switch to e-transfer at{" "}
            <span className="font-display font-semibold text-white">{etransferEmail}</span>.
          </p>
        )}
      </div>

      <Card className="mb-8">
        <h2 className="eyebrow text-navy mb-2">Fulfillment</h2>
        <p className="text-sm text-ink/80 leading-relaxed">
          Bryce will contact you when the order is ready to deliver the item(s).
        </p>
      </Card>

      <div className="flex gap-3">
        <LinkButton href="/" variant="secondary">Back to Storefront</LinkButton>
      </div>
    </div>
  );
}
