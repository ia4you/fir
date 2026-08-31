"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { entrenarConCriterios } from "../lib/entrenarPuntosDebiles";

// Menor que las 20 del test combinado de especialidades: es un repaso
// focalizado en un solo tema. Con LIMIT en la query, se autolimita solo a
// "todas las disponibles" en los temas (la inmensa mayoría) que tienen menos.
const TOTAL_PREGUNTAS_TEMA = 15;

// Mismos umbrales que EspecialidadesStatsTable, para que el "nivel" de un
// tema se lea igual que el de una especialidad en el resto de la pantalla.
function nivel(porcentaje) {
  if (porcentaje >= 75) return { emoji: "🟢", clase: "text-success" };
  if (porcentaje >= 50) return { emoji: "🟡", clase: "text-warning" };
  return { emoji: "🔴", clase: "text-danger" };
}

// Agrupa manteniendo el orden de primera aparición: como `temas` ya llega
// ordenado por porcentaje ascendente desde el endpoint, la primera
// especialidad del grupo es la que contiene el tema más flojo de todas.
function agruparPorEspecialidad(temas) {
  const grupos = new Map();
  for (const t of temas) {
    if (!grupos.has(t.especialidad)) grupos.set(t.especialidad, []);
    grupos.get(t.especialidad).push(t);
  }
  for (const lista of grupos.values()) {
    lista.sort((a, b) => a.porcentaje - b.porcentaje);
  }
  return Array.from(grupos.entries());
}

export default function TemasPorEspecialidad({ temas }) {
  const router = useRouter();
  const [abiertas, setAbiertas] = useState(() => new Set());
  // Nombre del tema cuyo test se está preparando ahora mismo, o null. Solo
  // uno a la vez: los botones de otros temas se deshabilitan mientras tanto.
  const [cargandoTema, setCargandoTema] = useState(null);
  const [errorTema, setErrorTema] = useState(null); // { tema, message } | null

  if (!temas || temas.length === 0) return null;

  const grupos = agruparPorEspecialidad(temas);

  function toggle(especialidad) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(especialidad)) next.delete(especialidad);
      else next.add(especialidad);
      return next;
    });
  }

  async function entrenarTema(tema) {
    if (cargandoTema) return;
    setErrorTema(null);
    setCargandoTema(tema);
    try {
      const resultado = await entrenarConCriterios({
        temas: [tema],
        cantidad: TOTAL_PREGUNTAS_TEMA,
        router,
      });
      if (resultado.limiteAlcanzado) {
        setErrorTema({ tema, message: resultado.message });
        setCargandoTema(null);
      }
      // Éxito: no se hace setCargandoTema(null) a propósito — el componente
      // se desmonta al navegar a /test/[id], igual que en PuntosDebiles.js.
    } catch (e) {
      setErrorTema({ tema, message: "No se ha podido preparar el test. Inténtalo de nuevo." });
      setCargandoTema(null);
    }
  }

  return (
    <section className="mt-7 px-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
        Por tema
      </h2>

      <div className="flex flex-col gap-2">
        {grupos.map(([especialidad, temasEspecialidad]) => {
          const abierta = abiertas.has(especialidad);
          const peorTema = temasEspecialidad[0];

          return (
            <div key={especialidad} className="overflow-hidden rounded-2xl bg-card shadow-sm">
              <button
                type="button"
                onClick={() => toggle(especialidad)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="font-semibold text-ink">{especialidad}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted">
                    {temasEspecialidad.length} tema{temasEspecialidad.length !== 1 ? "s" : ""}
                  </span>
                  <span className={`text-sm font-bold ${nivel(peorTema.porcentaje).clase}`}>
                    {peorTema.porcentaje}%
                  </span>
                  <span
                    className={`text-ink-muted transition-transform ${abierta ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </div>
              </button>

              {abierta && (
                <ul className="flex flex-col divide-y divide-track border-t border-track">
                  {temasEspecialidad.map((t) => {
                    const { emoji, clase } = nivel(t.porcentaje);
                    return (
                      <li key={t.tema} className="flex flex-col gap-1.5 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="min-w-0 flex-1 text-sm text-ink">
                            {emoji} {t.tema}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              // No hay ningún onClick en un ancestro de este
                              // botón (el toggle de la especialidad vive en
                              // un <button> hermano, no un padre), pero se
                              // detiene la propagación igualmente por si
                              // cambia la estructura más adelante.
                              e.stopPropagation();
                              entrenarTema(t.tema);
                            }}
                            disabled={cargandoTema === t.tema}
                            className="flex-shrink-0 text-xs font-bold text-brand active:text-brand-dark disabled:opacity-60"
                          >
                            {cargandoTema === t.tema ? "Preparando…" : "Entrenar →"}
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-ink-muted">
                          <div className="flex items-center gap-2">
                            {!t.fiable && (
                              <span className="rounded-full bg-track px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                                Pocos datos
                              </span>
                            )}
                            <span>
                              {t.aciertos}/{t.total} respondidas
                            </span>
                          </div>
                          <span className={`font-bold ${clase}`}>{t.porcentaje}%</span>
                        </div>
                        {errorTema?.tema === t.tema && (
                          <p className="rounded-xl bg-danger-bg p-2 text-xs font-semibold text-danger-text">
                            {errorTema.message}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
