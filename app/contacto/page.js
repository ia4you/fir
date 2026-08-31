"use client";

import { useState } from "react";
import Link from "next/link";
import FieldCard from "../components/FieldCard";
import Footer from "../components/Footer";

const TIPOS = ["Reportar un error", "Sugerencia de mejora", "Problema con mi cuenta", "Otro"];

export default function Contacto() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | ok | error
  const [error, setError] = useState("");

  const mensajeValido = mensaje.trim().length >= 20;

  async function enviar(e) {
    e.preventDefault();
    setError("");
    if (!mensajeValido) {
      setError("El mensaje debe tener al menos 20 caracteres.");
      return;
    }
    setEstado("enviando");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, tipo, mensaje }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se ha podido enviar el mensaje");
      setEstado("ok");
    } catch (err) {
      setError(err.message);
      setEstado("error");
    }
  }

  return (
    <div className="min-h-screen bg-surface px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-sm font-semibold text-brand">
          ← Volver a inicio
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          Contacto y sugerencias
        </h1>
        <p className="mt-3 text-ink-muted">
          ¿Has encontrado un error, tienes una idea de mejora o necesitas ayuda con tu cuenta?
          Escríbenos y te responderemos en menos de 48 horas.
        </p>

        {estado === "ok" ? (
          <div className="mt-8 rounded-2xl bg-success-bg p-5 text-center text-sm font-semibold text-success-text">
            ¡Mensaje enviado! Te responderemos en menos de 48 horas.
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-8 flex flex-col gap-4">
            <FieldCard label="Nombre">
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-12 w-full rounded-xl border border-track bg-card px-4 font-medium text-ink focus:border-brand focus:outline-none"
                placeholder="Tu nombre"
              />
            </FieldCard>

            <FieldCard label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-track bg-card px-4 font-medium text-ink focus:border-brand focus:outline-none"
                placeholder="tu@email.com"
              />
            </FieldCard>

            <FieldCard label="Tipo de mensaje">
              <div className="relative">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-track bg-card px-4 pr-10 font-semibold text-ink focus:border-brand focus:outline-none"
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </FieldCard>

            <FieldCard label="Mensaje">
              <textarea
                required
                rows={5}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full rounded-xl border border-track bg-card px-4 py-3 font-medium text-ink focus:border-brand focus:outline-none"
                placeholder="Cuéntanos con detalle qué ha pasado o qué te gustaría ver…"
              />
              <p
                className={`mt-1.5 text-xs font-medium ${
                  mensajeValido ? "text-success-text" : "text-ink-muted"
                }`}
              >
                {mensaje.trim().length}/20 caracteres mínimo
              </p>
            </FieldCard>

            {error && (
              <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={estado === "enviando"}
              className="h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark disabled:opacity-60"
            >
              {estado === "enviando" ? "Enviando…" : "Enviar mensaje"}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
