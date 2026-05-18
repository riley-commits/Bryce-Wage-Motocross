import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/auth";

const BUCKET = "product-images";

// Multipart upload of one or more images to the product's folder.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;
  const form = await req.formData();
  const files = form.getAll("files");
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  // Determine starting sort_order so new images go at the end.
  const { data: existing } = await sb
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId);
  const startSort =
    (existing ?? []).reduce((max, r) => Math.max(max, r.sort_order ?? 0), -1) + 1;

  const uploads: { storage_path: string; sort_order: number }[] = [];
  let i = 0;
  for (const f of files) {
    if (!(f instanceof File)) continue;
    if (f.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: `${f.name} is over 8 MB — please compress before uploading.` },
        { status: 400 }
      );
    }
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase().slice(0, 6);
    const key = `${productId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(key, f, { contentType: f.type, upsert: false });
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    uploads.push({ storage_path: key, sort_order: startSort + i });
    i++;
  }

  if (uploads.length === 0) {
    return NextResponse.json({ error: "No valid files" }, { status: 400 });
  }

  const { error: insErr } = await sb.from("product_images").insert(
    uploads.map((u) => ({ ...u, product_id: productId }))
  );
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ uploaded: uploads.length });
}

// Reorder images.
const reorderSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().nonnegative() })),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;
  const parsed = reorderSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  for (const row of parsed.data.order) {
    const { error } = await sb
      .from("product_images")
      .update({ sort_order: row.sort_order })
      .eq("id", row.id)
      .eq("product_id", productId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Delete an image (by row id) and its storage object.
const deleteSchema = z.object({ image_id: z.string().uuid() });

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await params;
  const parsed = deleteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const sb = supabaseAdmin();
  const { data: row, error: selErr } = await sb
    .from("product_images")
    .select("storage_path")
    .eq("id", parsed.data.image_id)
    .eq("product_id", productId)
    .maybeSingle();
  if (selErr || !row) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
  await sb.storage.from(BUCKET).remove([row.storage_path]);
  const { error: delErr } = await sb
    .from("product_images")
    .delete()
    .eq("id", parsed.data.image_id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
