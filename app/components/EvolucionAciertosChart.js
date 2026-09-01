"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Paleta categórica para distinguir líneas de tema: brand, success,
// warning, danger y brand.dark de tailwind.config.js, más un amber oscuro
// como sexto tono (badge.bg/text ahora es gris neutro y se confundiría con
// la cuadrícula, así que aquí no se reutiliza).
const COLORES = ["#0f766e", "#22c55e", "#f59e0b", "#CB4644", "#b45309", "#115e59"];

const TODOS = "Todos los temas";

function formatearFechaCorta(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function TooltipPersonalizado({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const punto = payload[0];

  return (
    <div className="rounded-xl bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white shadow-lg">
      <p>{punto.payload.fechaCompleta}</p>
      <p className="mt-0.5" style={{ color: punto.color }}>
        {punto.value}%
      </p>
    </div>
  );
}

export default function EvolucionAciertosChart({ sesionesEvolucion }) {
  // null = "Todos los temas" (comportamiento por defecto).
  const [temaActivo, setTemaActivo] = useState(null);

  if (!sesionesEvolucion || sesionesEvolucion.length === 0) return null;

  // El backend ya entrega, por tema, sus propias últimas 10 sesiones
  // (ROW_NUMBER PARTITION BY tema en /api/sesiones/evolucion), ordenadas
  // ASC por fecha. Aquí solo se agrupan por tema.
  const porTema = new Map();
  for (const s of sesionesEvolucion) {
    const t = s.tema || TODOS;
    if (!porTema.has(t)) porTema.set(t, []);
    porTema.get(t).push(s);
  }

  const temas = [...porTema.keys()];

  const alternarTema = (t) => {
    setTemaActivo((actual) => (t === TODOS || actual === t ? null : t));
  };

  const temaVisible = temaActivo ?? TODOS;
  const serieActiva = porTema.get(temaVisible) ?? [];

  // Eje X por posición relativa (sesión 1, 2, 3...), no por fecha real: cada
  // tema tiene su propia ventana temporal y mezclarlas en un eje de fechas
  // compartido dejaría el gráfico disperso. La fecha real se conserva en el
  // tooltip vía fechaCompleta.
  const datos = serieActiva.map((s, i) => ({
    posicion: i + 1,
    fechaCompleta: `${formatearFechaCorta(s.fecha)} · ${temaVisible}`,
    valor: s.porcentaje,
  }));

  const datosInsuficientes = datos.length < 2;
  const colorActivo = COLORES[temas.indexOf(temaVisible) % COLORES.length];

  return (
    <section className="px-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
        Evolución de aciertos
      </h2>
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {temas.map((t, i) => {
            const activo = t === temaVisible;
            const atenuado = !activo;
            return (
              <button
                key={t}
                type="button"
                onClick={() => alternarTema(t)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold text-ink-muted transition-opacity ${
                  atenuado ? "opacity-40" : "opacity-100"
                } ${activo ? "ring-1 ring-inset ring-[var(--track)]" : ""}`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORES[i % COLORES.length] }}
                />
                {t}
              </button>
            );
          })}
        </div>
        {datosInsuficientes ? (
          <div className="flex h-[220px] items-center justify-center px-6 text-center text-sm font-semibold text-ink-muted">
            {temaActivo
              ? `Necesitas al menos 2 sesiones de ${temaActivo} para ver su evolución. Llevas ${datos.length}.`
              : `Necesitas al menos 2 sesiones para ver tu evolución. Llevas ${datos.length}.`}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={datos} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--track)" vertical={false} />
              <XAxis
                dataKey="posicion"
                tickFormatter={(v) => `Sesión ${v}`}
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--track)" }}
                allowDecimals={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<TooltipPersonalizado />} />
              <Line
                type="monotone"
                dataKey="valor"
                stroke={colorActivo}
                strokeWidth={2}
                dot={{ r: 4, fill: colorActivo }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
