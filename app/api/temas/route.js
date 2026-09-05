import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Público sin sesión: la lista de temas ya está expuesta en /temas, esto
// solo la sirve como JSON para el selector de /configuracion.
//
// Guarda defensiva: mientras no exista clasificación por tema para FIR
// (tabla `temas` sin crear todavía, o creada pero vacía), esto debe
// responder [] en vez de 500 — el selector de /configuracion debe poder
// renderizarse igualmente, solo sin opciones de tema.
export async function GET() {
  try {
    const { rows } = await query(
      `SELECT tema FROM temas ORDER BY num_preguntas DESC`
    );
    return NextResponse.json(rows.map((r) => r.tema));
  } catch (err) {
    if (err.code === "42P01") {
      // undefined_table: tabla `temas` todavía no existe para esta convocatoria.
      return NextResponse.json([]);
    }
    console.error(err);
    return NextResponse.json({ error: "Error al cargar los temas" }, { status: 500 });
  }
}
