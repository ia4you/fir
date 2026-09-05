"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "../../components/BottomNav";
import ResumenDiario from "../../components/ResumenDiario";
import TemasStatsTable from "../../components/TemasStatsTable";
import ListaTemas from "../../components/ListaTemas";
import PuntosDebiles from "../../components/PuntosDebiles";
import EvolucionAciertosChart from "../../components/EvolucionAciertosChart";
import { getMetaDiaria } from "../../lib/preferencias";

const ETIQUETA_MODO = {
  practica: "Práctica",
  repaso: "Repaso de fallos",
  puntos_debiles: "Puntos débiles",
  repaso_errores: "Repaso de errores",
  simulacro: "Simulacro FIR",
};

function formatearFecha(iso) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${fecha}, ${hora}`;
}

export default function Estadisticas() {
  const [datos, setDatos] = useState(null);
  const [temas, setTemas] = useState(null);
  const [sesiones, setSesiones] = useState(null);
  const [sesionesEvolucion, setSesionesEvolucion] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/estadisticas?meta=${getMetaDiaria()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDatos)
      .catch(() => setError(true));

    fetch("/api/estadisticas/temas")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setTemas(d.temas))
      .catch(() => setTemas([]));

    fetch("/api/sesiones")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSesiones)
      .catch(() => setSesiones([]));

    // Una sola carga al montar: la agrupación por tema ya viene resuelta
    // del backend, así que el clic en la leyenda del gráfico solo cambia
    // qué grupo ya cargado se pinta, sin volver a pedir datos.
    fetch("/api/sesiones/evolucion")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSesionesEvolucion)
      .catch(() => setSesionesEvolucion([]));
  }, []);

  return (
    <div className="min-h-screen pb-28">
      <header className="px-5 pt-safe">
        <h1 className="text-2xl font-extrabold text-ink">Estadísticas</h1>
      </header>

      <div className="mt-5">
        <ResumenDiario
          racha={datos?.racha_dias}
          metaDiariaPct={datos?.meta_diaria.porcentaje}
        />
      </div>

      {sesionesEvolucion && sesionesEvolucion.length > 0 && (
        <div className="mt-7">
          <EvolucionAciertosChart sesionesEvolucion={sesionesEvolucion} />
        </div>
      )}

      <section className="mt-7 px-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
          Por tema
        </h2>

        {error && (
          <p className="rounded-2xl bg-card p-4 text-sm text-ink-muted shadow-sm">
            No se ha podido cargar tu progreso.
          </p>
        )}

        {!error && datos && datos.temas.length === 0 && (
          <div className="rounded-2xl bg-card p-4 text-sm text-ink-muted shadow-sm">
            Todavía no has respondido ninguna pregunta.
          </div>
        )}

        {!error && datos && datos.temas.length > 0 && (
          <TemasStatsTable temas={datos.temas} />
        )}

        {!error && !datos && (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-card shadow-sm" />
            ))}
          </div>
        )}
      </section>

      {!error && datos && datos.temas.length > 0 && (
        <PuntosDebiles temas={datos.temas} />
      )}

      {temas && temas.length > 0 && <ListaTemas temas={temas} />}

      <section className="mt-7 px-5">
        <Link
          href="/errores"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand font-bold text-brand"
        >
          Mis errores →
        </Link>
      </section>

      <section className="mt-7 px-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
          Historial de sesiones
        </h2>

        {sesiones && sesiones.length === 0 && (
          <div className="rounded-2xl bg-card p-4 text-sm text-ink-muted shadow-sm">
            Todavía no has completado ningún test — ¡empieza desde{" "}
            <span className="font-semibold text-brand">Práctica</span>!
          </div>
        )}

        {sesiones && sesiones.length > 0 && (
          <div className="flex flex-col gap-3">
            {sesiones.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink">{s.tema || "Todos los temas"}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {ETIQUETA_MODO[s.modo] || s.modo} · {formatearFecha(s.fecha)}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 font-bold ${
                      s.porcentaje > 70
                        ? "text-success"
                        : s.porcentaje >= 40
                        ? "text-warning"
                        : "text-danger"
                    }`}
                  >
                    {s.porcentaje}%
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {s.aciertos}/{s.total_preguntas} preguntas
                </p>
              </div>
            ))}
          </div>
        )}

        {!sesiones && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[70px] animate-pulse rounded-2xl bg-card shadow-sm" />
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  );
}
