"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { formatCAD } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { browserProductImageUrl } from "@/lib/supabase/browser";

const formSchema = z
  .object({
    customer_name: z.string().trim().min(1, "Required").max(120),
    contact_method: z.enum(["email", "phone"]),
    contact_value: z.string().trim().min(1, "Required").max(200),
    payment_method: z.enum(["etransfer", "cash"], {
      message: "Pick a payment method",
    }),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.contact_method === "email") {
      if (!z.string().email().safeParse(data.contact_value).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contact_value"],
          message: "Enter a valid email",
        });
      }
    } else {
      // Loose phone check on the client; server normalizes to E.164.
      const digits = data.contact_value.replace(/\D/g, "");
      if (digits.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contact_value"],
          message: "Enter a valid phone number (10 digits)",
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, hydrated, subtotalCents, clear } = useCart();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderingOpen, setOrderingOpen] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      customer_name: "",
      contact_method: "email",
      contact_value: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetch("/api/settings/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setOrderingOpen(!!d.ordering_open))
      .catch(() => setOrderingOpen(false));
  }, []);

  // Bounce empty carts back home.
  useEffect(() => {
    if (hydrated && lines.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, lines.length, router]);

  const contactMethod = watch("contact_method");
  const paymentMethod = watch("payment_method");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          items: lines.map((l) => ({
            product_id: l.product_id,
            size_label: l.size_label,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data?.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      // Cart cleared on confirmation page.
      router.push(`/confirmation/${encodeURIComponent(data.order_number)}`);
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-muted">Loading...</div>;
  }
  if (lines.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display font-bold text-navy text-3xl sm:text-4xl mb-8">
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8"
      >
        <div className="space-y-8">
          {/* Contact info */}
          <Card>
            <h2 className="font-display font-semibold text-navy text-lg mb-4">
              Your Info
            </h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="customer_name">Full name</Label>
                <Input id="customer_name" {...register("customer_name")} />
                <FieldError>{errors.customer_name?.message}</FieldError>
              </div>

              <div>
                <Label>Preferred contact method</Label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="email"
                      className="peer sr-only"
                      {...register("contact_method")}
                    />
                    <span className="block text-center px-4 py-2.5 rounded-sm border border-navy/20 cursor-pointer peer-checked:bg-navy peer-checked:text-white peer-checked:border-navy eyebrow text-sm transition-colors">
                      Email
                    </span>
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      value="phone"
                      className="peer sr-only"
                      {...register("contact_method")}
                    />
                    <span className="block text-center px-4 py-2.5 rounded-sm border border-navy/20 cursor-pointer peer-checked:bg-navy peer-checked:text-white peer-checked:border-navy eyebrow text-sm transition-colors">
                      Phone
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="contact_value">
                  {contactMethod === "email" ? "Email address" : "Phone number"}
                </Label>
                <Input
                  id="contact_value"
                  type={contactMethod === "email" ? "email" : "tel"}
                  placeholder={contactMethod === "email" ? "you@example.com" : "(204) 555-0123"}
                  {...register("contact_value")}
                />
                <FieldError>{errors.contact_value?.message}</FieldError>
              </div>
            </div>
          </Card>

          {/* Fulfillment */}
          <Card>
            <h2 className="font-display font-semibold text-navy text-lg mb-2">
              Order Fulfillment
            </h2>
            <p className="text-sm text-ink/80 leading-relaxed">
              Bryce will contact you when the order is ready to deliver the item(s).
            </p>
          </Card>

          {/* Payment */}
          <Card>
            <h2 className="font-display font-semibold text-navy text-lg mb-2">
              Payment Method
            </h2>
            <p className="text-sm text-muted mb-4">
              No payment is processed online. Pick how you'll pay Bryce.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="etransfer"
                  className="peer sr-only"
                  {...register("payment_method")}
                />
                <div className="rounded-sm border border-navy/20 p-4 peer-checked:border-red peer-checked:bg-red/5 transition-colors">
                  <p className="eyebrow text-navy mb-1">E-Transfer</p>
                  <p className="text-xs text-muted">
                    Send funds to Bryce's e-transfer email after he confirms your order.
                  </p>
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  value="cash"
                  className="peer sr-only"
                  {...register("payment_method")}
                />
                <div className="rounded-sm border border-navy/20 p-4 peer-checked:border-red peer-checked:bg-red/5 transition-colors">
                  <p className="eyebrow text-navy mb-1">Cash, In Person</p>
                  <p className="text-xs text-muted">
                    Pay in cash when Bryce delivers the item(s).
                  </p>
                </div>
              </label>
            </div>
            <FieldError>{errors.payment_method?.message}</FieldError>
          </Card>

          {/* Notes */}
          <Card>
            <h2 className="font-display font-semibold text-navy text-lg mb-2">
              Notes <span className="text-muted text-sm font-normal">(optional)</span>
            </h2>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Anything Bryce should know? Pickup preferences, gift instructions, etc."
              {...register("notes")}
            />
          </Card>
        </div>

        {/* Order Summary */}
        <aside className="rounded-md border border-navy/10 bg-white p-5 h-fit lg:sticky lg:top-20">
          <h2 className="eyebrow text-navy mb-4">Order Summary</h2>
          <ul className="space-y-3 mb-5 text-sm">
            {lines.map((l) => {
              const imgUrl = browserProductImageUrl(l.image_path);
              return (
                <li
                  key={`${l.product_id}::${l.size_label}`}
                  className="flex gap-3"
                >
                  <div className="w-12 h-12 rounded-xs bg-cream overflow-hidden shrink-0">
                    {imgUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy truncate">{l.product_name}</p>
                    <p className="text-xs text-muted">
                      {l.size_label} · qty {l.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-navy whitespace-nowrap">
                    {formatCAD(l.unit_price_cents * l.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>
          <hr className="hairline border-t mb-4" />
          <div className="flex justify-between items-baseline mb-6">
            <span className="eyebrow text-navy">Subtotal</span>
            <span className="font-display font-semibold text-red text-xl">
              {formatCAD(subtotalCents)}
            </span>
          </div>

          {serverError && (
            <p className="mb-4 p-3 rounded-xs bg-red/10 border border-red/30 text-red-deep text-sm">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!isValid || !paymentMethod || submitting || orderingOpen === false}
          >
            {orderingOpen === false
              ? "Ordering Closed"
              : submitting
                ? "Submitting..."
                : "Place Interest Order"}
          </Button>
          <p className="mt-3 text-xs text-muted text-center">
            No payment taken now. Bryce will contact you after the window closes.
          </p>
        </aside>
      </form>
    </div>
  );
}
