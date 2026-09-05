"use client";

import { useEffect, useState } from "react";

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminListaEspera() {
  const [emails, setEmails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/lista-espera")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setEmails)
      .catch(() => setError("No se ha podido cargar la lista de espera."));
  }, []);

  function exportarCsv() {
    const filas = [
      ["email", "fecha_registro"],
      ...emails.map((e) => [e.email, e.created_at]),
    ];
    const csv = filas.map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lista-espera-fir-turel-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">{error}</p>;
  }

  if (!emails) {
    return <p className="text-sm text-ink-muted">Cargando lista de espera…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink-muted">
          {emails.length} personas en lista de espera
        </p>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={emails.length === 0}
          className="flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-60"
        >
          Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead>
            <tr className="border-b border-track bg-panel text-xs font-bold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Fecha de registro</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id} className="border-b border-track last:border-0">
                <td className="px-4 py-3 font-semibold text-ink">{e.email}</td>
                <td className="px-4 py-3 text-ink-muted">{formatearFecha(e.created_at)}</td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-ink-muted">
                  Todavía no hay nadie en la lista de espera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
