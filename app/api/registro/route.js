import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { mailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const REGEX_NUMERO = /\d/;
const REGEX_MAYUSCULA = /[A-Z]/;
const REGEX_SIMBOLO = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

function passwordEsFuerte(password) {
  return (
    password.length >= 8 &&
    REGEX_NUMERO.test(password) &&
    REGEX_MAYUSCULA.test(password) &&
    REGEX_SIMBOLO.test(password)
  );
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const nombre = body?.nombre?.trim();
  const email = body?.email?.toLowerCase().trim();
  const password = body?.password;
  const terminosAceptados = body?.terminos === true;

  if (!nombre || !email || !password) {
    return NextResponse.json(
      { error: "Nombre, email y contraseña son obligatorios" },
      { status: 400 }
    );
  }
  if (!passwordEsFuerte(password)) {
    return NextResponse.json(
      {
        error:
          "La contraseña debe tener al menos 8 caracteres, un número, un símbolo y una mayúscula",
      },
      { status: 400 }
    );
  }
  if (!terminosAceptados) {
    return NextResponse.json(
      { error: "Debes aceptar los términos de uso y el aviso legal" },
      { status: 400 }
    );
  }

  try {
    const existe = await query(`SELECT id FROM usuarios WHERE email = $1`, [email]);
    if (existe.rows.length > 0) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, plan, terminos_aceptados, terminos_fecha)
       VALUES ($1, $2, $3, 'free', TRUE, NOW())
       RETURNING id, terminos_fecha`,
      [nombre, email, passwordHash]
    );

    // el email es solo una notificación extra — si falla, el usuario ya quedó
    // registrado en la BD, así que no debe romper la respuesta al usuario
    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.SMTP_TO,
        subject: `Nuevo registro en PIR Turel — ${nombre}`,
        text: [
          `Nombre: ${nombre}`,
          `Email: ${email}`,
          `Fecha: ${rows[0].terminos_fecha.toISOString()}`,
          `Plan: free`,
          "",
          "Ver en el panel: https://pir.turel.es/admin",
        ].join("\n"),
      });
    } catch (err) {
      console.error("Error enviando email de notificación de registro:", err);
    }

    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}
