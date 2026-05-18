import { z } from "zod";

// E.164 normalize: strip everything but digits and leading +, then ensure
// Canadian / US numbers (10 digits) become +1XXXXXXXXXX.
export function normalizePhoneE164(input: string): string | null {
  const trimmed = input.trim();
  const digitsOnly = trimmed.replace(/[^\d+]/g, "");

  if (digitsOnly.startsWith("+")) {
    const rest = digitsOnly.slice(1);
    if (rest.length >= 10 && rest.length <= 15 && /^\d+$/.test(rest)) {
      return `+${rest}`;
    }
    return null;
  }

  const digits = digitsOnly.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return null;
}

export const checkoutSchema = z
  .object({
    customer_name: z.string().trim().min(1, "Name is required").max(120),
    contact_method: z.enum(["email", "phone"]),
    contact_value: z.string().trim().min(1, "Contact info is required").max(200),
    payment_method: z.enum(["etransfer", "cash"]),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    items: z
      .array(
        z.object({
          product_id: z.string().uuid(),
          size_label: z.string().trim().min(1).max(40),
          quantity: z.number().int().min(1).max(999),
        })
      )
      .min(1, "Cart cannot be empty"),
  })
  .superRefine((data, ctx) => {
    if (data.contact_method === "email") {
      const ok = z.string().email().safeParse(data.contact_value).success;
      if (!ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contact_value"],
          message: "Enter a valid email address",
        });
      }
    } else {
      const normalized = normalizePhoneE164(data.contact_value);
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contact_value"],
          message: "Enter a valid 10-digit phone number",
        });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  price_cents: z.number().int().positive(),
  active: z.boolean(),
  sort_order: z.number().int().nonnegative(),
  sizes: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        sort_order: z.number().int().nonnegative(),
      })
    )
    .min(1, "Add at least one size"),
});

export const settingsSchema = z.object({
  ordering_open: z.boolean(),
  ordering_window_label: z.string().trim().max(200).nullable(),
  etransfer_email: z.string().email().nullable().or(z.literal("")),
  owner_phone_e164: z
    .string()
    .trim()
    .nullable()
    .or(z.literal(""))
    .refine(
      (v) => !v || normalizePhoneE164(v) !== null,
      "Phone must be a valid 10-digit number or E.164 format"
    ),
});
