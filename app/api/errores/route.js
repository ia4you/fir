import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Con al menos este número de preguntas falladas distintas en una misma
// especialidad, se muestra el aviso de patrón ("Has fallado X preguntas
// relacionadas con..."). Mismo umbral que "puntos débiles" en /estadisticas
// para mantener el criterio consistente en toda la app.
const MIN_PREGUNTAS_PATRON = 3;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // Una fila por pregunta fallada al menos una vez, con el número total de
    // veces que se ha fallado (puede haberse respondido en varias sesiones).
    const { rows } = await query(
      `SELECT p.id, p.especialidad, p.pregunta, p.año, p.numero,
              COUNT(*)::int AS veces_fallada
       FROM respuestas_sesion rs
       JOIN preguntas p ON p.id = rs.pregunta_id
       WHERE rs.user_id = $1 AND rs.correcta = false
       GROUP BY p.id, p.especialidad, p.pregunta, p.año, p.numero
       ORDER BY p.especialidad ASC NULLS LAST, veces_fallada DESC, p.id ASC`,
      [userId]
    );

    const gruposPorEspecialidad = new Map();
    for (const r of rows) {
      const clave = r.especialidad || "Sin especialidad";
      if (!gruposPorEspecialidad.has(clave)) {
        gruposPorEspecialidad.set(clave, []);
      }
      gruposPorEspecialidad.get(clave).push({
        id: r.id,
        pregunta: r.pregunta,
        anio: r.año,
        numero: r.numero,
        veces_fallada: r.veces_fallada,
        recurrente: r.veces_fallada >= 2,
      });
    }

    const grupos = [...gruposPorEspecialidad.entries()]
      .map(([especialidad, preguntas]) => ({
        especialidad,
        total_preguntas: preguntas.length,
        total_fallos: preguntas.reduce((acc, p) => acc + p.veces_fallada, 0),
        patron: preguntas.length >= MIN_PREGUNTAS_PATRON,
        preguntas,
      }))
      .sort(
        (a, b) =>
          b.total_fallos - a.total_fallos ||
          a.especialidad.localeCompare(b.especialidad, "es")
      );

    return NextResponse.json({
      total_preguntas_falladas: rows.length,
      grupos,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al consultar tus errores" }, { status: 500 });
  }
}
