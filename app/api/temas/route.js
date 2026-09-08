import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Público sin sesión: sirve las áreas generales (11) para el selector
// "Tema" de /configuracion. Deliberadamente lee `preguntas.area`, no la
// tabla `temas` (esa es la navegación SEO de /temas, con los 66 subtemas
// finos, sin construir todavía en Fase 5) -- son dos granularidades
// distintas para dos usos distintos.
export async function GET() {
  try {
    const { rows } = await query(
      `SELECT DISTINCT area FROM preguntas WHERE area IS NOT NULL ORDER BY area`
    );
    return NextResponse.json(rows.map((r) => r.area));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al cargar las áreas" }, { status: 500 });
  }
}
