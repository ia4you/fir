// test_smtp.mjs
// -------------------------------
// Prueba directa de las credenciales SMTP configuradas en .env.local.
// No pasa por la API — usa nodemailer directamente, con la misma
// configuración que lib/mailer.js (puerto 25, sin TLS: es el único que
// autentica de forma fiable en mail.turel.es — 587/465 tienen un
// certificado autofirmado y una ruta de auth sobre TLS intermitente).
//
// Uso:
//   node --env-file=.env.local scripts/test_smtp.mjs

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});

async function main() {
  console.log(`Conectando a ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} como ${process.env.SMTP_USER} ...`);
  await transporter.verify();
  console.log("Conexión SMTP verificada correctamente.");

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "jose@turel.es",
    subject: "Prueba SMTP MIR Turel",
    text: "El servidor de correo está funcionando correctamente.",
  });

  console.log("Email enviado correctamente.");
  console.log("messageId:", info.messageId);
  console.log("response:", info.response);
}

main().catch((err) => {
  console.error("FALLO al enviar el email de prueba:");
  console.error(err);
  process.exit(1);
});
