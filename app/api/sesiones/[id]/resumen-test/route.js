import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { generarAnalisisNarrativo } from "@/lib/ai/resumenTest";

export const dynamic = "force-dynamic";

const UMBRAL_FUERTE_PORCENTAJE = 80;
const UMBRAL_FUERTE_MIN_PREGUNTAS = 3;
const UMBRAL_DEBIL_PORCENTAJE = 50;
const UMBRAL_DEBIL_MIN_PREGUNTAS = 2;
const AÑOS_RECIENTES = 2;
const DIFERENCIA_MIN_DESACTUALIZACION = 25;

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const sesionId = parseInt(params.id, 10);
  if (!Number.isInteger(sesionId)) {
    return NextResponse.json({ error: "id de sesión inválido" }, { status: 400 });
  }

  try {
    const sesionRes = await query(
      `SELECT id, modo, especialidad, total_preguntas, aciertos, duracion_segundos, user_id
       FROM sesiones WHERE id = $1`,
      [sesionId]
    );
    if (sesionRes.rows.length === 0) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }
    const sesion = sesionRes.rows[0];
    if (sesion.user_id !== Number(session.user.id)) {
      return NextResponse.json({ error: "No tienes acceso a esta sesión" }, { status: 403 });
    }

    const desgloseRes = await query(
      `SELECT p.especialidad,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE rs.correcta)::int AS aciertos
       FROM respuestas_sesion rs
       JOIN preguntas p ON p.id = rs.pregunta_id
       WHERE rs.sesion_id = $1
       GROUP BY p.especialidad`,
      [sesionId]
    );

    const desglose = desgloseRes.rows.map((r) => ({
      especialidad: r.especialidad,
      total: r.total,
      aciertos: r.aciertos,
      porcentaje: r.total > 0 ? Math.round((r.aciertos / r.total) * 1000) / 10 : 0,
    }));

    const fuertes = desglose.filter(
      (d) => d.porcentaje >= UMBRAL_FUERTE_PORCENTAJE && d.total >= UMBRAL_FUERTE_MIN_PREGUNTAS
    );
    const debiles = desglose.filter(
      (d) => d.porcentaje < UMBRAL_DEBIL_PORCENTAJE && d.total >= UMBRAL_DEBIL_MIN_PREGUNTAS
    );

    // Señal de posible desactualización: compara el % de aciertos en las
    // preguntas de los años más recientes del examen MIR presentes en esta
    // sesión frente a las más antiguas. Un hueco grande sugiere que el fallo
    // se concentra en contenido actualizado (guías recientes) más que en
    // olvido de contenido antiguo.
    const porAñoRes = await query(
      `SELECT p.año,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE rs.correcta)::int AS aciertos
       FROM respuestas_sesion rs
       JOIN preguntas p ON p.id = rs.pregunta_id
       WHERE rs.sesion_id = $1
       GROUP BY p.año`,
      [sesionId]
    );

    let posibleDesactualizacion = false;
    if (porAñoRes.rows.length > AÑOS_RECIENTES) {
      const añosOrdenados = porAñoRes.rows.map((r) => r.año).sort((a, b) => b - a);
      const añosRecientes = new Set(añosOrdenados.slice(0, AÑOS_RECIENTES));

      const recientes = porAñoRes.rows.filter((r) => añosRecientes.has(r.año));
      const antiguas = porAñoRes.rows.filter((r) => !añosRecientes.has(r.año));

      const totalRecientes = recientes.reduce((s, r) => s + r.total, 0);
      const aciertosRecientes = recientes.reduce((s, r) => s + r.aciertos, 0);
      const totalAntiguas = antiguas.reduce((s, r) => s + r.total, 0);
      const aciertosAntiguas = antiguas.reduce((s, r) => s + r.aciertos, 0);

      if (totalRecientes >= 2 && totalAntiguas >= 2) {
        const pctRecientes = (aciertosRecientes / totalRecientes) * 100;
        const pctAntiguas = (aciertosAntiguas / totalAntiguas) * 100;
        posibleDesactualizacion = pctAntiguas - pctRecientes >= DIFERENCIA_MIN_DESACTUALIZACION;
      }
    }

    const fallos = sesion.total_preguntas - sesion.aciertos;

    // Clasificación de fallos por calidad de la explicación oficial: algunas
    // preguntas del banco tienen la respuesta oficial cuestionada por la
    // comunidad médica (controversia) o son de dificultad muy alta
    // (orientativa); fallarlas no refleja el nivel real del estudiante igual
    // que un fallo normal, así que se muestran por separado.
    const fallosCalidadRes = await query(
      `SELECT p.explicacion_calidad
       FROM respuestas_sesion rs
       JOIN preguntas p ON p.id = rs.pregunta_id
       WHERE rs.sesion_id = $1 AND rs.correcta = false`,
      [sesionId]
    );

    let fallosControvertidos = 0;
    let fallosDificiles = 0;
    let fallosNormales = 0;
    for (const { explicacion_calidad } of fallosCalidadRes.rows) {
      if (explicacion_calidad === "controversia") fallosControvertidos++;
      else if (explicacion_calidad === "orientativa") fallosDificiles++;
      else fallosNormales++;
    }

    const { texto: analisisNarrativo, proveedor } = await generarAnalisisNarrativo({
      totalPreguntas: sesion.total_preguntas,
      aciertos: sesion.aciertos,
      fallos,
      fallosControvertidos,
      fallosDificiles,
      fallosNormales,
      fuertes,
      debiles,
      posibleDesactualizacion,
    });

    return NextResponse.json({
      puntuacion: `${sesion.aciertos}/${sesion.total_preguntas}`,
      tiempoTotalSeg: sesion.duracion_segundos,
      etiquetas: {
        fuertes: fuertes.map((f) => f.especialidad),
        debiles: debiles.map((d) => d.especialidad),
        posibleDesactualizacion,
      },
      desgloseFallos: {
        aciertos: sesion.aciertos,
        controvertidos: fallosControvertidos,
        dificiles: fallosDificiles,
        normales: fallosNormales,
      },
      analisisNarrativo,
      iaUsada: proveedor,
      iaDisponible: analisisNarrativo !== null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al generar el resumen del test" }, { status: 500 });
  }
}
