"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { entrenarConCriterios } from "../lib/entrenarPuntosDebiles";

// Menor que las 20 del test combinado de temas: es un repaso focalizado en
// un solo tema. Con LIMIT en la query, se autolimita solo a "todas las
// disponibles" en los temas (la inmensa mayoría) que tienen menos.
const TOTAL_PREGUNTAS_TEMA = 15;

// Mismos umbrales que TemasStatsTable, para que el "nivel" de un tema se
// lea igual en toda la pantalla.
function nivel(porcentaje) {
  if (porcentaje >= 75) return { emoji: "🟢", clase: "text-success" };
  if (porcentaje >= 50) return { emoji: "🟡", clase: "text-warning" };
  return { emoji: "🔴", clase: "text-danger" };
}

export default function ListaTemas({ temas }) {
  const router = useRouter();
  // Nombre del tema cuyo test se está preparando ahora mismo, o null. Solo
  // uno a la vez: los botones de otros temas se deshabilitan mientras tanto.
  const [cargandoTema, setCargandoTema] = useState(null);
  const [errorTema, setErrorTema] = useState(null); // { tema, message } | null

  if (!temas || temas.length === 0) return null;

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

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
        <ul className="flex flex-col divide-y divide-track">
          {temas.map((t) => {
            const { emoji, clase } = nivel(t.porcentaje);
            return (
              <li key={t.tema} className="flex flex-col gap-1.5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 text-sm text-ink">
                    {emoji} {t.tema}
                  </span>
                  <button
                    type="button"
                    onClick={() => entrenarTema(t.tema)}
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
      </div>
    </section>
  );
}
