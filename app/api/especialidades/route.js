import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      `SELECT especialidad, COUNT(*)::int AS total
       FROM preguntas
       WHERE especialidad IS NOT NULL
       GROUP BY especialidad
       ORDER BY especialidad`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al consultar especialidades" }, { status: 500 });
  }
}
