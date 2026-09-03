import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Público sin sesión: la lista de temas ya está expuesta en /temas, esto
// solo la sirve como JSON para el selector de /configuracion.
export async function GET() {
  try {
    const { rows } = await query(
      `SELECT tema FROM temas ORDER BY num_preguntas DESC`
    );
    return NextResponse.json(rows.map((r) => r.tema));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al cargar los temas" }, { status: 500 });
  }
}
