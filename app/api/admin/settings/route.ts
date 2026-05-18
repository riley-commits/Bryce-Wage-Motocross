import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { normalizePhoneE164 } from "@/lib/validators";

const schema = z.object({
  ordering_open: z.boolean().optional(),
  ordering_window_label: z.string().trim().max(200).nullable().optional(),
  etransfer_email: z.string().trim().max(200).nullable().optional(),
  owner_phone_e164: z.string().trim().max(40).nullable().optional(),
});

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.etransfer_email) {
    const ok = z.string().email().safeParse(data.etransfer_email).success;
    if (!ok) {
      return NextResponse.json(
        { error: "etransfer_email must be a valid email or empty" },
        { status: 400 }
      );
    }
  }

  if (data.owner_phone_e164) {
    const normalized = normalizePhoneE164(data.owner_phone_e164);
    if (!normalized) {
      return NextResponse.json(
        { error: "owner_phone_e164 must be a valid 10-digit phone or empty" },
        { status: 400 }
      );
    }
    data.owner_phone_e164 = normalized;
  }

  // Normalize empty strings to null so they're stored as missing.
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === "") payload[k] = null;
    else if (v !== undefined) payload[k] = v;
  }
  payload.updated_at = new Date().toISOString();

  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from("settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Settings row not found" }, { status: 500 });
  }
  const { error } = await sb
    .from("settings")
    .update(payload)
    .eq("id", existing.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
