import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const PLATAFORMAS_VALIDAS = ["web", "android"];

// Identificador único dentro del JSON de suscripción: en web push es la URL
// del endpoint del navegador; en Android (FCM) es el token del dispositivo.
function idDeSuscripcion(platform, subscription) {
  return platform === "android" ? subscription?.token : subscription?.endpoint;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const platform = PLATAFORMAS_VALIDAS.includes(body?.platform) ? body.platform : "web";
  const subscription = body?.subscription;
  const id = idDeSuscripcion(platform, subscription);

  if (!subscription || !id) {
    return NextResponse.json({ error: "subscription no válida" }, { status: 400 });
  }

  try {
    // Evita duplicados del mismo dispositivo/navegador reinscribiéndose, sin
    // perder las suscripciones de otros dispositivos del mismo usuario.
    const clave = platform === "android" ? "token" : "endpoint";
    const { rows: existentes } = await query(
      `SELECT id FROM push_subscriptions
       WHERE user_id = $1 AND platform = $2 AND subscription ->> $3 = $4`,
      [session.user.id, platform, clave, id]
    );
    if (existentes.length === 0) {
      await query(
        `INSERT INTO push_subscriptions (user_id, subscription, platform)
         VALUES ($1, $2, $3)`,
        [session.user.id, JSON.stringify(subscription), platform]
      );
    }
  } catch (err) {
    console.error("Error guardando suscripción push:", err);
    return NextResponse.json({ error: "No se ha podido guardar la suscripción" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
