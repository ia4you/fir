import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const LIMITE_DIARIO_FREE = 10;

// Solo sesiones ya finalizadas (duracion_segundos se rellena al terminar el
// test en /test/[id]); las abandonadas a medias no aparecen en el historial.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      `SELECT id, fecha, modo, tema, total_preguntas, aciertos, duracion_segundos
       FROM sesiones
       WHERE duracion_segundos IS NOT NULL AND user_id = $1
       ORDER BY fecha DESC
       LIMIT 20`,
      [session.user.id]
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        fecha: r.fecha,
        modo: r.modo,
        tema: r.tema,
        total_preguntas: r.total_preguntas,
        aciertos: r.aciertos,
        porcentaje: r.total_preguntas > 0 ? Math.round((r.aciertos / r.total_preguntas) * 100) : 0,
        duracion_segundos: r.duracion_segundos,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al consultar sesiones" }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.modo || !Number.isInteger(body.total_preguntas)) {
    return NextResponse.json(
      { error: "modo y total_preguntas son obligatorios" },
      { status: 400 }
    );
  }

  const { modo, tema = null, total_preguntas } = body;
  const userId = session.user.id;

  try {
    // El simulacro PIR completo (200+ preguntas de golpe) es función premium
    // explícita: el límite diario de abajo no lo cubriría (solo cuenta
    // sesiones YA completadas, así que un usuario free podría crear una
    // sesión de simulacro entera antes de toparse con el límite).
    if (modo === "simulacro" && session.user.plan !== "premium") {
      return NextResponse.json(
        {
          error: "premium_requerido",
          message: "El simulacro PIR completo es una función premium.",
        },
        { status: 403 }
      );
    }

    if (session.user.plan !== "premium") {
      const { rows } = await query(
        `SELECT COALESCE(SUM(total_preguntas), 0)::int AS total
         FROM sesiones
         WHERE user_id = $1 AND duracion_segundos IS NOT NULL AND DATE(fecha) = CURRENT_DATE`,
        [userId]
      );
      if (rows[0].total >= LIMITE_DIARIO_FREE) {
        return NextResponse.json(
          {
            error: "limite_diario",
            message:
              "Has alcanzado el límite diario de 10 preguntas. Hazte premium para acceso ilimitado.",
          },
          { status: 403 }
        );
      }
    }

    const { rows } = await query(
      `INSERT INTO sesiones (modo, tema, total_preguntas, aciertos, user_id)
       VALUES ($1, $2, $3, 0, $4)
       RETURNING id`,
      [modo, tema, total_preguntas, userId]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al crear la sesión" }, { status: 500 });
  }
}
