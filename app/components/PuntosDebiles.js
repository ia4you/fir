"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { entrenarConCriterios } from "../lib/entrenarPuntosDebiles";

// Umbral unificado con el `fiable` de /api/estadisticas/temas (antes 3).
const MIN_RESPUESTAS_PARA_CONTAR = 5;
const TOTAL_PREGUNTAS_ENTRENAMIENTO = 20;

export default function PuntosDebiles({ especialidades }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const debiles = especialidades
    .filter((e) => e.total >= MIN_RESPUESTAS_PARA_CONTAR)
    .sort((a, b) => a.porcentaje - b.porcentaje || b.total - a.total)
    .slice(0, 5);

  async function entrenarPuntosDebiles() {
    if (debiles.length === 0 || cargando) return;
    setError("");
    setCargando(true);
    try {
      const resultado = await entrenarConCriterios({
        especialidades: debiles.map((e) => e.especialidad),
        cantidad: TOTAL_PREGUNTAS_ENTRENAMIENTO,
        router,
      });
      if (resultado.limiteAlcanzado) {
        setError(resultado.message);
        setCargando(false);
      }
      // Éxito: no se hace setCargando(false) a propósito, igual que antes
      // del refactor — el componente se desmonta al navegar a /test/[id].
    } catch (e) {
      setError("No se ha podido preparar el test. Inténtalo de nuevo.");
      setCargando(false);
    }
  }

  return (
    <section className="mt-7 px-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">
        Tus 5 puntos débiles
      </h2>

      {debiles.length === 0 ? (
        <div className="rounded-2xl bg-card p-4 text-sm text-ink-muted shadow-sm">
          Responde al menos {MIN_RESPUESTAS_PARA_CONTAR} preguntas de una especialidad para que
          detectemos tus puntos débiles.
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <ul className="flex flex-col divide-y divide-track">
            {debiles.map((e, i) => (
              <li key={e.especialidad} className="flex items-center justify-between py-2.5">
                <span className="font-semibold text-ink">
                  {i + 1}. {e.especialidad}
                </span>
                <span className="font-bold text-danger">{e.porcentaje}%</span>
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-3 rounded-xl bg-danger-bg p-2 text-xs font-semibold text-danger-text">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={entrenarPuntosDebiles}
            disabled={cargando}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white shadow-sm active:bg-brand-dark disabled:opacity-60"
          >
            {cargando ? "Preparando…" : "Entrenar mis puntos débiles →"}
          </button>
        </div>
      )}
    </section>
  );
}
