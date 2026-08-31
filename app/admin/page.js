"use client";

import { useEffect, useMemo, useState } from "react";

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [confirmando, setConfirmando] = useState(null); // { id, nombre, nuevoPlan } | null
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const res = await fetch("/api/admin/usuarios");
      if (!res.ok) throw new Error();
      setUsuarios(await res.json());
    } catch {
      setError("No se ha podido cargar la lista de usuarios.");
    }
  }

  const filtrados = useMemo(() => {
    if (!usuarios) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [usuarios, busqueda]);

  const resumen = useMemo(() => {
    if (!usuarios) return null;
    const premium = usuarios.filter((u) => u.plan === "premium").length;
    return { total: usuarios.length, premium, free: usuarios.length - premium };
  }, [usuarios]);

  async function cambiarPlan() {
    if (!confirmando) return;
    setActualizando(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${confirmando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: confirmando.nuevoPlan }),
      });
      if (!res.ok) throw new Error();
      setUsuarios((prev) =>
        prev.map((u) => (u.id === confirmando.id ? { ...u, plan: confirmando.nuevoPlan } : u))
      );
      setConfirmando(null);
    } catch {
      setError("No se ha podido actualizar el plan.");
    } finally {
      setActualizando(false);
    }
  }

  if (error) {
    return <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">{error}</p>;
  }

  if (!usuarios) {
    return <p className="text-sm text-ink-muted">Cargando usuarios…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink-muted">
          {resumen.total} usuarios totales · {resumen.premium} premium · {resumen.free} free
        </p>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="h-11 w-full rounded-xl border border-track bg-card px-4 text-sm font-medium text-ink focus:border-brand focus:outline-none sm:w-72"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-track bg-panel text-xs font-bold uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Términos</th>
              <th className="px-4 py-3">Stripe customer</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} className="border-b border-track last:border-0">
                <td className="px-4 py-3 text-ink-muted">{u.id}</td>
                <td className="px-4 py-3 font-semibold text-ink">{u.nombre}</td>
                <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                      u.plan === "premium" ? "bg-brand text-white" : "bg-track text-ink-muted"
                    }`}
                  >
                    {u.plan === "premium" ? "PREMIUM" : "FREE"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatearFecha(u.created_at)}</td>
                <td className="px-4 py-3">
                  {u.terminos_aceptados ? (
                    <span className="text-success">✓</span>
                  ) : (
                    <span className="text-danger">✗</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                  {u.stripe_customer_id || "—"}
                </td>
                <td className="px-4 py-3">
                  {u.plan === "premium" ? (
                    <button
                      type="button"
                      onClick={() => setConfirmando({ id: u.id, nombre: u.nombre, nuevoPlan: "free" })}
                      className="rounded-lg border border-track px-3 py-1.5 text-xs font-bold text-ink"
                    >
                      → Free
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmando({ id: u.id, nombre: u.nombre, nuevoPlan: "premium" })}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white"
                    >
                      → Premium
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-muted">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {confirmando && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-lg">
            <p className="text-lg font-bold text-ink">¿Cambiar plan?</p>
            <p className="mt-1 text-sm text-ink-muted">
              {confirmando.nombre} pasará a{" "}
              <span className="font-bold text-ink">
                {confirmando.nuevoPlan === "premium" ? "PREMIUM" : "FREE"}
              </span>
              .
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                className="h-11 flex-1 rounded-xl border border-track font-bold text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={cambiarPlan}
                disabled={actualizando}
                className="h-11 flex-1 rounded-xl bg-brand font-bold text-white disabled:opacity-60"
              >
                {actualizando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
