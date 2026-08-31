import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Estas estadísticas son por usuario (cada uno ve solo lo suyo). La meta
// diaria se guarda en localStorage (ver app/lib/preferencias.js) y se pasa
// como ?meta=N; 20 es solo el valor por defecto si no se indica.
const META_DIARIA_POR_DEFECTO = 20;

// Con menos respuestas que esto en una especialidad no hay datos suficientes
// para partir en "mitad antigua / mitad reciente" y calcular una tendencia fiable.
const MIN_RESPUESTAS_TENDENCIA = 4;
// Diferencia mínima (en proporción, 0-1) entre la mitad reciente y la
// antigua para considerar que hay una tendencia real y no ruido.
const UMBRAL_TENDENCIA = 0.15;

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const metaParam = parseInt(searchParams.get("meta"), 10);
    const metaDiariaPreguntas =
      Number.isInteger(metaParam) && metaParam > 0 ? metaParam : META_DIARIA_POR_DEFECTO;

    const diasRes = await query(
      `SELECT DISTINCT DATE(fecha) AS dia FROM sesiones WHERE user_id = $1 ORDER BY dia DESC`,
      [userId]
    );
    const dias = diasRes.rows.map((r) => r.dia.toISOString().slice(0, 10));

    let racha = 0;
    let cursor = new Date();
    for (;;) {
      const clave = cursor.toISOString().slice(0, 10);
      if (dias.includes(clave)) {
        racha++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    const hoyRes = await query(
      `SELECT COUNT(*)::int AS total
       FROM respuestas_sesion rs
       JOIN sesiones s ON s.id = rs.sesion_id
       WHERE DATE(s.fecha) = CURRENT_DATE AND rs.user_id = $1`,
      [userId]
    );
    const respondidasHoy = hoyRes.rows[0].total;
    const metaDiariaPct = Math.min(
      100,
      Math.round((respondidasHoy / metaDiariaPreguntas) * 100)
    );

    // Partimos de TODAS las especialidades (no solo las ya practicadas) para
    // que el usuario vea el mapa completo desde el primer día, con 0% en las
    // que todavía no ha tocado. La tendencia compara la mitad más reciente de
    // respuestas de cada especialidad (por fecha de sesión) contra la mitad
    // más antigua.
    const especialidadesRes = await query(
      `WITH respuestas_ordenadas AS (
         SELECT p.especialidad,
                rs.correcta,
                ROW_NUMBER() OVER (PARTITION BY p.especialidad ORDER BY s.fecha ASC, rs.id ASC) AS orden,
                COUNT(*) OVER (PARTITION BY p.especialidad) AS total_respuestas
         FROM respuestas_sesion rs
         JOIN sesiones s ON s.id = rs.sesion_id
         JOIN preguntas p ON p.id = rs.pregunta_id
         WHERE rs.user_id = $1
       ),
       tendencia_especialidad AS (
         SELECT especialidad,
                AVG(CASE WHEN orden <= total_respuestas / 2.0 THEN correcta::int END) AS pct_antigua,
                AVG(CASE WHEN orden > total_respuestas / 2.0 THEN correcta::int END) AS pct_reciente
         FROM respuestas_ordenadas
         GROUP BY especialidad
       )
       SELECT esp.especialidad,
              COUNT(rs.id)::int AS total,
              COUNT(*) FILTER (WHERE rs.correcta)::int AS aciertos,
              t.pct_antigua,
              t.pct_reciente
       FROM (SELECT DISTINCT especialidad FROM preguntas) esp
       LEFT JOIN preguntas p ON p.especialidad = esp.especialidad
       LEFT JOIN respuestas_sesion rs ON rs.pregunta_id = p.id AND rs.user_id = $1
       LEFT JOIN tendencia_especialidad t ON t.especialidad = esp.especialidad
       GROUP BY esp.especialidad, t.pct_antigua, t.pct_reciente
       ORDER BY total DESC, esp.especialidad ASC`,
      [userId]
    );

    return NextResponse.json({
      racha_dias: racha,
      meta_diaria: {
        objetivo: metaDiariaPreguntas,
        respondidas_hoy: respondidasHoy,
        porcentaje: metaDiariaPct,
      },
      especialidades: especialidadesRes.rows.map((r) => {
        const total = r.total;
        const aciertos = r.aciertos;
        let tendencia = "flat";
        if (total >= MIN_RESPUESTAS_TENDENCIA && r.pct_antigua !== null && r.pct_reciente !== null) {
          const diff = parseFloat(r.pct_reciente) - parseFloat(r.pct_antigua);
          if (diff >= UMBRAL_TENDENCIA) tendencia = "up";
          else if (diff <= -UMBRAL_TENDENCIA) tendencia = "down";
        }
        return {
          especialidad: r.especialidad,
          total,
          aciertos,
          porcentaje: total > 0 ? Math.round((aciertos / total) * 100) : 0,
          tendencia,
        };
      }),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al calcular estadísticas" }, { status: 500 });
  }
}
