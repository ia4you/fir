import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Ventana por especialidad (no global): para el gráfico de evolución de
// aciertos, cada especialidad necesita sus propias últimas 10 sesiones, no
// las últimas 10 sesiones del usuario mezclando especialidades — si no, una
// especialidad con histórico abundante pero poco reciente queda enterrada
// por sesiones de otras especialidades más nuevas. PARTITION BY especialidad
// agrupa los NULL ("Todas las especialidades") entre sí igual que un GROUP BY.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      `WITH ranked AS (
         SELECT id, fecha, especialidad, total_preguntas, aciertos,
                ROW_NUMBER() OVER (
                  PARTITION BY especialidad
                  ORDER BY fecha DESC
                ) AS rn
         FROM sesiones
         WHERE duracion_segundos IS NOT NULL AND user_id = $1
       )
       SELECT id, fecha, especialidad, total_preguntas, aciertos
       FROM ranked
       WHERE rn <= 10
       ORDER BY fecha ASC`,
      [session.user.id]
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        fecha: r.fecha,
        especialidad: r.especialidad,
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
