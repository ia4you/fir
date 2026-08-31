import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sesionId = parseInt(params.id, 10);
  if (!Number.isInteger(sesionId)) {
    return NextResponse.json({ error: "id de sesión inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Number.isInteger(body.aciertos)) {
    return NextResponse.json({ error: "aciertos es obligatorio" }, { status: 400 });
  }

  const duracionSegundos = Number.isInteger(body.duracion_segundos)
    ? body.duracion_segundos
    : null;

  try {
    const propietario = await query(`SELECT user_id FROM sesiones WHERE id = $1`, [sesionId]);
    if (propietario.rows.length === 0) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }
    if (propietario.rows[0].user_id !== Number(session.user.id)) {
      return NextResponse.json({ error: "No tienes acceso a esta sesión" }, { status: 403 });
    }

    const { rows } = await query(
      `UPDATE sesiones
       SET aciertos = $1, duracion_segundos = $2
       WHERE id = $3
       RETURNING id, modo, especialidad, total_preguntas, aciertos, duracion_segundos`,
      [body.aciertos, duracionSegundos, sesionId]
    );
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al actualizar la sesión" }, { status: 500 });
  }
}
