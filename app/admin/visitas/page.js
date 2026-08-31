"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatearFechaCorta(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatearFechaCompleta(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

function TooltipPersonalizado({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const punto = payload[0];
  return (
    <div className="rounded-xl bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white shadow-lg">
      <p>{formatearFechaCompleta(punto.payload.fecha)}</p>
      <p className="mt-0.5" style={{ color: "#99f6e4" }}>
        {punto.value} visitas
      </p>
    </div>
  );
}

function Kpi({ etiqueta, valor }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <p className="text-sm font-semibold text-ink-muted">{etiqueta}</p>
      <p className="mt-1 text-3xl font-extrabold text-ink">{valor.toLocaleString("es-ES")}</p>
    </div>
  );
}

export default function AdminVisitas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/visitas")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setDatos)
      .catch(() => setError("No se han podido cargar las visitas."));
  }, []);

  if (error) {
    return <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">{error}</p>;
  }

  if (!datos) {
    return <p className="text-sm text-ink-muted">Cargando visitas…</p>;
  }

  const datosGrafica = datos.por_dia.map((d) => ({ ...d, fechaCorta: formatearFechaCorta(d.fecha) }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi etiqueta="Hoy" valor={datos.totales.hoy} />
        <Kpi etiqueta="Esta semana" valor={datos.totales.semana} />
        <Kpi etiqueta="Este mes" valor={datos.totales.mes} />
        <Kpi etiqueta="Históricas" valor={datos.totales.historico} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
          Visitas por día (últimos 30 días)
        </h2>
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={datosGrafica} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--track)" vertical={false} />
              <XAxis
                dataKey="fechaCorta"
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--track)" }}
                interval={2}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "var(--panel)" }} />
              <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
