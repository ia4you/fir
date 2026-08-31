import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { mailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const TIPOS_VALIDOS = [
  "Reportar un error",
  "Sugerencia de mejora",
  "Problema con mi cuenta",
  "Otro",
];

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const nombre = body?.nombre?.trim();
  const email = body?.email?.trim();
  const tipo = body?.tipo?.trim();
  const mensaje = body?.mensaje?.trim();

  if (!nombre || !email || !tipo || !mensaje) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json({ error: "Tipo de mensaje no válido" }, { status: 400 });
  }
  if (mensaje.length < 20) {
    return NextResponse.json(
      { error: "El mensaje debe tener al menos 20 caracteres" },
      { status: 400 }
    );
  }

  let fila;
  try {
    const { rows } = await query(
      `INSERT INTO contacto (nombre, email, tipo, mensaje)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [nombre, email, tipo, mensaje]
    );
    fila = rows[0];
  } catch (err) {
    console.error("Error guardando mensaje de contacto:", err);
    return NextResponse.json({ error: "No se ha podido enviar el mensaje" }, { status: 500 });
  }

  // el email es solo una notificación extra — si falla, el mensaje ya quedó
  // guardado en la BD, así que no debe romper la respuesta al usuario
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_TO,
      subject: `Nuevo mensaje en PIR Turel — ${tipo}`,
      text: [
        `Nombre: ${nombre}`,
        `Email: ${email}`,
        `Tipo: ${tipo}`,
        `Mensaje: ${mensaje}`,
        `Fecha: ${fila.created_at.toISOString()}`,
        "",
        "Ver todos los mensajes en: https://pir.turel.es/admin/contacto",
      ].join("\n"),
    });
  } catch (err) {
    console.error("Error enviando email de notificación de contacto:", err);
  }

  return NextResponse.json({ ok: true, id: fila.id }, { status: 200 });
}
