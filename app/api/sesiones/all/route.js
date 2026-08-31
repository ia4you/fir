import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Borra el historial del usuario autenticado (sesiones + respuestas_sesion
// en cascada por la FK ON DELETE CASCADE). Solo las suyas: con multiusuario,
// un DELETE sin filtrar borraría el historial de todo el mundo.
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { rowCount } = await query(`DELETE FROM sesiones WHERE user_id = $1`, [session.user.id]);
    return NextResponse.json({ eliminadas: rowCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al borrar el historial" }, { status: 500 });
  }
}
