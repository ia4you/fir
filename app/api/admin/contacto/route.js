import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { rows } = await query(
    `SELECT id, nombre, email, tipo, mensaje, leido, created_at
     FROM contacto
     ORDER BY created_at DESC`
  );

  return NextResponse.json(rows);
}
