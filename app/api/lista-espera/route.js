import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getServerSession(authOptions).catch(() => null);

  const body = await request.json().catch(() => null);
  const email = body?.email ? String(body.email).trim().toLowerCase() : session?.user?.email;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO lista_espera (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING`,
      [email]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se ha podido registrar el interés" }, { status: 500 });
  }
}
