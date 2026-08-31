import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getWebpush } from "@/lib/webpush";

export const dynamic = "force-dynamic";

// Endpoint interno: no lo llama el navegador, solo el propio servidor desde
// scripts/enviar-recordatorio.mjs (por cron) u otro código de servidor.
// Protegido con un secreto compartido en vez de sesión, porque el cron no
// tiene sesión de usuario con la que autenticarse.
export async function POST(request) {
  const secreto = request.headers.get("x-cron-secret");
  if (!secreto || secreto !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = parseInt(body?.user_id, 10);
  const titulo = body?.title;
  const texto = body?.body;
  const url = body?.url || "/inicio";

  if (!Number.isInteger(userId) || !titulo || !texto) {
    return NextResponse.json(
      { error: "user_id, title y body son obligatorios" },
      { status: 400 }
    );
  }

  const { rows: suscripciones } = await query(
    `SELECT id, subscription, platform FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );

  const payload = JSON.stringify({ title: titulo, body: texto, url });
  let enviadas = 0;
  let eliminadas = 0;
  let omitidasAndroid = 0;

  for (const s of suscripciones) {
    if (s.platform === "android") {
      // Requiere Firebase Cloud Messaging (google-services.json + Admin SDK
      // con credenciales de servicio), todavía no configurado — ver aviso
      // en el resumen de la funcionalidad.
      omitidasAndroid++;
      continue;
    }
    try {
      const webpush = getWebpush();
      await webpush.sendNotification(s.subscription, payload);
      enviadas++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Suscripción caducada o revocada por el navegador: se limpia.
        await query(`DELETE FROM push_subscriptions WHERE id = $1`, [s.id]);
        eliminadas++;
      } else {
        console.error("Error enviando push:", err);
      }
    }
  }

  return NextResponse.json({ enviadas, eliminadas, omitidas_android: omitidasAndroid });
}
