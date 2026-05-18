import { NextResponse } from "next/server";
import { supabaseAnonServer } from "@/lib/supabase/server";

// Tiny endpoint so client components (cart, checkout) can read public settings
// without bundling the Supabase client. Returns safe fields only.
export async function GET() {
  const sb = supabaseAnonServer();
  const { data, error } = await sb.rpc("public_settings");
  if (error) {
    return NextResponse.json(
      { ordering_open: false, ordering_window_label: null, etransfer_email: null },
      { status: 200 }
    );
  }
  const row = Array.isArray(data) ? data[0] : null;
  return NextResponse.json(
    row ?? { ordering_open: false, ordering_window_label: null, etransfer_email: null }
  );
}
