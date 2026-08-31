"use client";

import { useState } from "react";
import Link from "next/link";
import FieldCard from "../components/FieldCard";

export default function EliminarCuenta() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | ok | error
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEstado("enviando");
    try {
      const res = await fetch("/api/eliminar-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se ha podido registrar la solicitud");
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
          Eliminar mi cuenta
        </h1>
        <p className="mt-3 text-ink-muted">
          Introduce el email con el que te registraste en PIR Turel. Recibiremos tu solicitud y
          eliminaremos tu cuenta, tu historial de tests y tus respuestas de forma permanente.
        </p>

        {estado === "ok" ? (
          <div className="mt-8 rounded-2xl bg-success-bg p-5 text-center text-sm font-semibold text-success-text">
            Solicitud recibida. Eliminaremos tu cuenta y te confirmaremos por email en los
            próximos días.
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-8 flex flex-col gap-4">
            <FieldCard label="Email de tu cuenta">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-track bg-card px-4 font-medium text-ink focus:border-brand focus:outline-none"
                placeholder="tu@email.com"
              />
            </FieldCard>

            {error && <p className="text-sm font-semibold text-danger-text">{error}</p>}

            <button
              type="submit"
              disabled={estado === "enviando"}
              className="h-14 w-full rounded-2xl bg-danger text-lg font-bold text-white shadow-sm disabled:opacity-60"
            >
              {estado === "enviando" ? "Enviando…" : "Solicitar eliminación de mi cuenta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
