import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "id no válido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const plan = body?.plan;
  if (plan !== "premium" && plan !== "free") {
    return NextResponse.json({ error: "plan debe ser 'premium' o 'free'" }, { status: 400 });
  }

  const { rows } = await query(
    `UPDATE usuarios SET plan = $1 WHERE id = $2 RETURNING id, plan`,
    [plan, id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
