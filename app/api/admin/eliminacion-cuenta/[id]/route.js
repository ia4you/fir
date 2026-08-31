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

  const { rows } = await query(
    `UPDATE solicitudes_eliminacion SET procesada = TRUE WHERE id = $1 RETURNING id, procesada`,
    [id]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
