import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Con menos respuestas que esto en un tema, el porcentaje no es fiable
// (una sola respuesta ya da 0% o 100%).
const MIN_RESPUESTAS_FIABLE = 5;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const temasRes = await query(
      `SELECT p.especialidad,
              p.tema,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE rs.correcta)::int AS aciertos
       FROM respuestas_sesion rs
       JOIN preguntas p ON p.id = rs.pregunta_id
       WHERE rs.user_id = $1 AND p.tema IS NOT NULL
       GROUP BY p.especialidad, p.tema
       ORDER BY (COUNT(*) FILTER (WHERE rs.correcta))::float / COUNT(*) ASC`,
      [userId]
    );

    return NextResponse.json({
      temas: temasRes.rows.map((r) => ({
        especialidad: r.especialidad,
        tema: r.tema,
        total: r.total,
        aciertos: r.aciertos,
        porcentaje: r.total > 0 ? Math.round((r.aciertos / r.total) * 100) : 0,
        fiable: r.total >= MIN_RESPUESTAS_FIABLE,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al calcular estadísticas por tema" }, { status: 500 });
  }
}
