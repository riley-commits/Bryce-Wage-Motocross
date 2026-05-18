import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/auth";

const productInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
  price_cents: z.number().int().positive(),
  active: z.boolean(),
  sort_order: z.number().int().nonnegative().default(0),
  sizes: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        sort_order: z.number().int().nonnegative().default(0),
      })
    )
    .min(1, "Add at least one size"),
});

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = productInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { sizes, ...productData } = parsed.data;
  const sb = supabaseAdmin();
  const { data: product, error } = await sb
    .from("products")
    .insert({
      ...productData,
      description: productData.description || null,
    })
    .select("id")
    .single();
  if (error || !product) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }
  if (sizes.length > 0) {
    const rows = sizes.map((s) => ({
      product_id: product.id,
      label: s.label,
      sort_order: s.sort_order,
    }));
    const { error: sErr } = await sb.from("product_sizes").insert(rows);
    if (sErr) {
      await sb.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: sErr.message }, { status: 500 });
    }
  }
  return NextResponse.json({ id: product.id });
}
