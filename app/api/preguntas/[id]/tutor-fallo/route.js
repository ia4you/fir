import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { generarTutorFallo } from "@/lib/ai/tutorFallo";

export const dynamic = "force-dynamic";

const LETRAS_VALIDAS = new Set(["A", "B", "C", "D", "E"]);

// Solo exige sesión iniciada (igual que /api/preguntas): no se ata a una
// sesion_id/respuesta_sesion concreta porque el contenido revelado (la
// explicación de por qué la opción correcta lo es) no es más sensible que la
// explicación oficial que ya se muestra en toda corrección normal.
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const preguntaId = parseInt(params.id, 10);
  if (!Number.isInteger(preguntaId)) {
    return NextResponse.json({ error: "id de pregunta inválido" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const respuestaDada = body?.respuesta_dada
    ? String(body.respuesta_dada).trim().toUpperCase()
    : null;
  if (respuestaDada !== null && !LETRAS_VALIDAS.has(respuestaDada)) {
    return NextResponse.json({ error: "respuesta_dada inválida" }, { status: 400 });
  }

  try {
    const { rows } = await query(
      `SELECT pregunta, especialidad, correcta, explicacion,
              opcion_a, opcion_b, opcion_c, opcion_d, opcion_e
       FROM preguntas WHERE id = $1`,
      [preguntaId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });
    }
    const p = rows[0];
    const respuestaCorrecta = p.correcta.trim();

    if (respuestaDada !== null && respuestaDada === respuestaCorrecta) {
      return NextResponse.json({ error: "Esta pregunta no fue fallada" }, { status: 400 });
    }

    const opciones = {
      A: p.opcion_a,
      B: p.opcion_b,
      C: p.opcion_c,
      D: p.opcion_d,
      E: p.opcion_e,
    };

    const analisis = await generarTutorFallo({
      pregunta: p.pregunta,
      especialidad: p.especialidad,
      opciones,
      respuestaDada,
      respuestaCorrecta,
      explicacionOficial: p.explicacion,
    });

    return NextResponse.json({ analisis });
  } catch (err) {
    console.error("tutor-fallo:", err.message);
    return NextResponse.json(
      { error: "No se ha podido generar la explicación. Inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
