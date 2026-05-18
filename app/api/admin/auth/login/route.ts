import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, verifyAdminPassword } from "@/lib/auth";

const schema = z.object({ password: z.string().min(1).max(500) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const ok = await verifyAdminPassword(parsed.data.password);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const session = await getAdminSession();
  session.authenticated = true;
  session.loggedInAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true });
}
