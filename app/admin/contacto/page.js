"use client";

import { useEffect, useMemo, useState } from "react";

function formatearFecha(iso) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncar(texto, n) {
  return texto.length > n ? `${texto.slice(0, n)}…` : texto;
}

export default function AdminContacto() {
  const [mensajes, setMensajes] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const res = await fetch("/api/admin/contacto");
      if (!res.ok) throw new Error();
      setMensajes(await res.json());
    } catch {
      setError("No se ha podido cargar los mensajes.");
    }
  }

  async function alternarExpandido(m) {
    const abriendo = expandidoId !== m.id;
    setExpandidoId(abriendo ? m.id : null);

    if (abriendo && !m.leido) {
      setMensajes((prev) => prev.map((x) => (x.id === m.id ? { ...x, leido: true } : x)));
      fetch(`/api/admin/contacto/${m.id}`, { method: "PATCH" }).catch(() => {});
    }
  }

  const resumen = useMemo(() => {
    if (!mensajes) return null;
    const sinLeer = mensajes.filter((m) => !m.leido).length;
    return { total: mensajes.length, sinLeer };
  }, [mensajes]);

  if (error) {
    return <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">{error}</p>;
  }

  if (!mensajes) {
    return <p className="text-sm text-ink-muted">Cargando mensajes…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-ink-muted">
        {resumen.total} mensajes · {resumen.sinLeer} sin leer
      </p>

      <div className="flex flex-col gap-3">
        {mensajes.map((m) => {
          const abierto = expandidoId === m.id;
          return (
            <div key={m.id} className="rounded-2xl bg-card shadow-sm">
              <button
                type="button"
                onClick={() => alternarExpandido(m)}
                className="flex w-full flex-col gap-1 p-4 text-left"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      m.leido ? "bg-track text-ink-muted" : "bg-brand text-white"
                    }`}
                  >
                    {m.leido ? "Leído" : "Nuevo"}
                  </span>
                  <span className="rounded-full bg-badge-bg px-2.5 py-1 text-xs font-bold text-badge-text">
                    {m.tipo}
                  </span>
                  <span className="text-xs text-ink-muted">{formatearFecha(m.created_at)}</span>
                </div>
                <p className="text-sm font-bold text-ink">
                  {m.nombre} <span className="font-normal text-ink-muted">— {m.email}</span>
                </p>
                {!abierto && <p className="text-sm text-ink-muted">{truncar(m.mensaje, 100)}</p>}
              </button>

              {abierto && (
                <div className="border-t border-track px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm text-ink">{m.mensaje}</p>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: MIR Turel")}`}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white"
                  >
                    Responder
                  </a>
                </div>
              )}
            </div>
          );
        })}
        {mensajes.length === 0 && (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-ink-muted shadow-sm">
            Todavía no hay mensajes.
          </p>
        )}
      </div>
    </div>
  );
}
