import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Ventana por tema (no global): para el gráfico de evolución de aciertos,
// cada tema necesita sus propias últimas 10 sesiones, no las últimas 10
// sesiones del usuario mezclando temas — si no, un tema con histórico
// abundante pero poco reciente queda enterrado por sesiones de otros temas
// más nuevas. PARTITION BY tema agrupa los NULL ("Todos los temas") entre
// sí igual que un GROUP BY.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      `WITH ranked AS (
         SELECT id, fecha, tema, total_preguntas, aciertos,
                ROW_NUMBER() OVER (
                  PARTITION BY tema
                  ORDER BY fecha DESC
                ) AS rn
         FROM sesiones
         WHERE duracion_segundos IS NOT NULL AND user_id = $1
       )
       SELECT id, fecha, tema, total_preguntas, aciertos
       FROM ranked
       WHERE rn <= 10
       ORDER BY fecha ASC`,
      [session.user.id]
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        fecha: r.fecha,
        tema: r.tema,
        total_preguntas: r.total_preguntas,
        aciertos: r.aciertos,
        porcentaje: r.total_preguntas > 0 ? Math.round((r.aciertos / r.total_preguntas) * 100) : 0,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al consultar la evolución" }, { status: 500 });
  }
}
