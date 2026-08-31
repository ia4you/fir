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

export default function AdminEliminacionCuenta() {
  const [solicitudes, setSolicitudes] = useState(null);
  const [error, setError] = useState("");
  const [procesandoId, setProcesandoId] = useState(null);
  const [avisos, setAvisos] = useState({});

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const res = await fetch("/api/admin/eliminacion-cuenta");
      if (!res.ok) throw new Error();
      setSolicitudes(await res.json());
    } catch {
      setError("No se ha podido cargar las solicitudes.");
    }
  }

  async function marcarProcesada(id) {
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, procesada: true } : s)));
    try {
      const res = await fetch(`/api/admin/eliminacion-cuenta/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
    } catch {
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, procesada: false } : s)));
    }
  }

  async function eliminarCuentaAhora(id) {
    if (!confirm("Esto borrará la cuenta, el historial y las respuestas de ese email de forma permanente. ¿Continuar?")) {
      return;
    }
    setProcesandoId(id);
    try {
      const res = await fetch(`/api/admin/eliminacion-cuenta/${id}/procesar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, procesada: true } : s)));
      setAvisos((prev) => ({
        ...prev,
        [id]: data.cuenta_encontrada
          ? "Cuenta eliminada."
          : "No había ninguna cuenta con ese email — marcada como procesada igualmente.",
      }));
    } catch {
      setAvisos((prev) => ({ ...prev, [id]: "Error al eliminar la cuenta." }));
    } finally {
      setProcesandoId(null);
    }
  }

  const resumen = useMemo(() => {
    if (!solicitudes) return null;
    const pendientes = solicitudes.filter((s) => !s.procesada).length;
    return { total: solicitudes.length, pendientes };
  }, [solicitudes]);

  if (error) {
    return <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">{error}</p>;
  }

  if (!solicitudes) {
    return <p className="text-sm text-ink-muted">Cargando solicitudes…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-ink-muted">
        {resumen.total} solicitudes · {resumen.pendientes} pendientes
      </p>

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-track bg-panel text-xs font-bold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Fecha de solicitud</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id} className="border-b border-track last:border-0">
                <td className="px-4 py-3 font-semibold text-ink">{s.email}</td>
                <td className="px-4 py-3 text-ink-muted">{formatearFecha(s.created_at)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      s.procesada ? "bg-track text-ink-muted" : "bg-danger-bg text-danger-text"
                    }`}
                  >
                    {s.procesada ? "Procesada" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.procesada && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => eliminarCuentaAhora(s.id)}
                          disabled={procesandoId === s.id}
                          className="whitespace-nowrap text-sm font-bold text-danger disabled:opacity-60"
                        >
                          {procesandoId === s.id ? "Eliminando…" : "Eliminar cuenta ahora"}
                        </button>
                        <button
                          type="button"
                          onClick={() => marcarProcesada(s.id)}
                          disabled={procesandoId === s.id}
                          className="whitespace-nowrap text-sm font-bold text-ink-muted disabled:opacity-60"
                        >
                          Solo marcar
                        </button>
                      </div>
                      {avisos[s.id] && (
                        <p className="text-xs text-ink-muted">{avisos[s.id]}</p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-muted">
                  No hay solicitudes de eliminación de cuenta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
