import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/db-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdmin } from "@/lib/admin-log";
import { assertSameOrigin } from "@/lib/origin";

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin().from("game_item_catalog").select("item_type, price, sort").order("sort");
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

const schema = z.object({ item_type: z.string().max(20), price: z.number().int().min(0).max(1000000) });

export async function PUT(req: Request) {
  if (!assertSameOrigin(req) || !requireAdmin(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_input" }, { status: 400 });
  const { error } = await admin().from("game_item_catalog").update({ price: parsed.data.price }).eq("item_type", parsed.data.item_type);
  if (error) return NextResponse.json({ error: "db" }, { status: 500 });
  await logAdmin("catalog_update", parsed.data.item_type, { price: parsed.data.price });
  return NextResponse.json({ status: "ok" });
}
