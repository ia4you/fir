import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { eliminarCuentaPorId } from "@/lib/eliminarCuenta";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);

  try {
    await eliminarCuentaPorId(userId, session.user.email);
  } catch (err) {
    console.error("Error eliminando cuenta:", err);
    return NextResponse.json({ error: "No se ha podido eliminar la cuenta" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
