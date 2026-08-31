import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }

  let fila;
  try {
    const { rows } = await query(
      `INSERT INTO solicitudes_eliminacion (email) VALUES ($1) RETURNING id, created_at`,
      [email]
    );
    fila = rows[0];
  } catch (err) {
    console.error("Error guardando solicitud de eliminación:", err);
    return NextResponse.json({ error: "No se ha podido registrar la solicitud" }, { status: 500 });
  }

  // el email es solo una notificación extra — si falla, la solicitud ya
  // quedó guardada en la BD, así que no debe romper la respuesta al usuario
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: "jose@turel.es",
      subject: "Nueva solicitud de eliminación de cuenta — PIR Turel",
      text: [
        `Email: ${email}`,
        `Fecha: ${fila.created_at.toISOString()}`,
        "",
        "Ver todas las solicitudes en: https://pir.turel.es/admin/eliminacion-cuenta",
      ].join("\n"),
    });
  } catch (err) {
    console.error("Error enviando email de notificación de eliminación de cuenta:", err);
  }

  return NextResponse.json({ ok: true, id: fila.id }, { status: 200 });
}
