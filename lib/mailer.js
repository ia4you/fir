import nodemailer from "nodemailer";

// mail.turel.es solo autentica de forma fiable en el puerto 25 (sin cifrar) —
// en 587/465 el certificado autofirmado del servidor y su ruta de auth sobre
// TLS son intermitentes (verificado directamente, ver scripts/test_smtp*.mjs).
export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});
