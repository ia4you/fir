import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const CANTIDAD_DEFECTO = 6;
// Endpoint público sin sesión: se limita a un puñado de preguntas para que
// no sirva como forma de descargarse el banco completo (con respuesta
// incluida) sin registrarse.
const CANTIDAD_MAXIMA = 10;

// Devuelve preguntas de la demo pública, una por especialidad distinta (para
// que las 6 preguntas se sientan representativas del banco completo), con la
// respuesta correcta y la explicación incluidas: al no haber sesión que
// corregir después, la demo enseña el valor completo en la propia petición.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cantidadParam = searchParams.get("cantidad");
  let cantidad = cantidadParam ? parseInt(cantidadParam, 10) : CANTIDAD_DEFECTO;
  if (!Number.isInteger(cantidad) || cantidad <= 0) cantidad = CANTIDAD_DEFECTO;
  cantidad = Math.min(cantidad, CANTIDAD_MAXIMA);

  try {
    const { rows } = await query(
      `SELECT id, especialidad, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, opcion_e,
              imagen_path, correcta, explicacion, explicacion_calidad
       FROM (
         SELECT *, ROW_NUMBER() OVER (PARTITION BY especialidad ORDER BY RANDOM()) AS rn
         FROM preguntas
       ) sub
       WHERE rn = 1
       ORDER BY RANDOM()
       LIMIT $1`,
      [cantidad]
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al consultar preguntas" }, { status: 500 });
  }
}
