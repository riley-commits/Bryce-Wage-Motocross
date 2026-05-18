import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/auth";

const productInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable().optional(),
  price_cents: z.number().int().positive(),
  active: z.boolean(),
  sort_order: z.number().int().nonnegative(),
  sizes: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        label: z.string().trim().min(1).max(40),
        sort_order: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = productInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { sizes, ...productData } = parsed.data;
  const sb = supabaseAdmin();
  const { error: updErr } = await sb
    .from("products")
    .update({
      ...productData,
      description: productData.description || null,
    })
    .eq("id", id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Sizes: simplest correct approach — replace all rows. Orders snapshot
  // size_label at write time, so deleting/recreating is safe for history.
  await sb.from("product_sizes").delete().eq("product_id", id);
  if (sizes.length > 0) {
    const rows = sizes.map((s) => ({
      product_id: id,
      label: s.label,
      sort_order: s.sort_order,
    }));
    const { error: sErr } = await sb.from("product_sizes").insert(rows);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const sb = supabaseAdmin();
  // Soft "archive" by setting inactive — preserves order history.
  const { error } = await sb.from("products").update({ active: false }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
