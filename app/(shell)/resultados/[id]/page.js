"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SpecialtyProgressRow from "../../../components/SpecialtyProgressRow";

export default function Resultados({ params }) {
  const router = useRouter();
  const sesionId = params.id;

  const [datos, setDatos] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [repasando, setRepasando] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [resumenCargando, setResumenCargando] = useState(true);

  useEffect(() => {
    fetch(`/api/sesiones/${sesionId}/resultado`)
      .then((r) => {
        if (!r.ok) throw new Error("no encontrada");
        return r.json();
      })
      .then(setDatos)
      .catch(() => setNotFound(true));
  }, [sesionId]);

  useEffect(() => {
    if (notFound) {
      router.replace("/?error=sesion_no_encontrada");
    }
  }, [notFound, router]);

  // Se pide solo cuando /resultado ya confirmó que la sesión existe y es
  // accesible, para no gastar una llamada de IA en sesiones inválidas.
  // Si falla por cualquier motivo (red, 401/403/404/500), resumen se queda
  // en null y la pantalla sigue funcionando solo con los datos de `datos`.
  useEffect(() => {
    if (!datos) return;
    fetch(`/api/sesiones/${sesionId}/resumen-test`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setResumen)
      .catch(() => setResumen(null))
      .finally(() => setResumenCargando(false));
  }, [datos, sesionId]);

  async function repasarFallos() {
    if (!datos || datos.preguntas_falladas.length === 0 || repasando) return;
    setRepasando(true);
    try {
      const idsParam = datos.preguntas_falladas.join(",");
      const resPreguntas = await fetch(`/api/preguntas?ids=${idsParam}`);
      const preguntas = await resPreguntas.json();

      const resSesion = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "repaso",
          especialidad: null,
          total_preguntas: preguntas.length,
        }),
      });
      const { id: nuevoId } = await resSesion.json();

      sessionStorage.setItem(
        `mir_test_${nuevoId}`,
        JSON.stringify({ preguntas, segundosPorPregunta: null })
      );
      router.push(`/test/${nuevoId}`);
    } catch (e) {
      setRepasando(false);
    }
  }

  if (notFound) return null;

  if (!datos) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink-muted">Cargando resultados…</p>
      </div>
    );
  }

  const tiempoMedio =
    datos.duracion_segundos != null && datos.total_preguntas > 0
      ? Math.round(datos.duracion_segundos / datos.total_preguntas)
      : null;

  const sinFallos = datos.preguntas_falladas.length === 0;

  const tieneContenidoResumen =
    resumen &&
    ((resumen.iaDisponible && resumen.analisisNarrativo) ||
      resumen.etiquetas.fuertes.length > 0 ||
      resumen.etiquetas.debiles.length > 0 ||
      resumen.etiquetas.posibleDesactualizacion ||
      Boolean(resumen.desgloseFallos));

  return (
    <div className="min-h-screen pb-10">
      <header className="rounded-b-3xl bg-brand px-5 pb-8 pt-safe text-center text-white">
        <p className="mt-2 text-sm">Resultados de la sesión</p>
        <p className="mt-2 text-5xl font-extrabold">
          {datos.aciertos}/{datos.total_preguntas}
        </p>
        <p className="mt-2 text-lg">{datos.porcentaje_aciertos}% de aciertos</p>
      </header>

      <section className="-mt-6 px-5">
        <div className="grid grid-cols-3 divide-x divide-track rounded-2xl bg-card py-4 shadow-sm">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-success">{datos.aciertos}</p>
            <p className="text-sm text-ink-muted">Aciertos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-danger">{datos.fallos}</p>
            <p className="text-sm text-ink-muted">Fallos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-ink">
              {tiempoMedio !== null ? `${tiempoMedio}s` : "—"}
            </p>
            <p className="text-sm text-ink-muted">T. medio</p>
          </div>
        </div>
      </section>

      {datos.modo === "simulacro" && datos.simulacro && (
        <section className="mt-6 px-5">
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">
              Resultado del Simulacro PIR {datos.simulacro.anio}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-ink">
              {datos.simulacro.puntuacion.toFixed(2)}{" "}
              <span className="text-base font-semibold text-ink-muted">puntos</span>
            </p>
            <p className="text-sm text-ink-muted">
              {datos.simulacro.porcentaje_estimado}% estimado de aciertos — fórmula oficial
              (aciertos − 1/3 de fallos)
            </p>

            <div className="mt-3 grid grid-cols-3 divide-x divide-track border-t border-track pt-3">
              <div className="text-center">
                <p className="text-lg font-extrabold text-success">{datos.aciertos}</p>
                <p className="text-xs text-ink-muted">Aciertos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold text-danger">
                  {datos.simulacro.fallos_respondidos}
                </p>
                <p className="text-xs text-ink-muted">Fallos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-extrabold text-ink-muted">{datos.simulacro.en_blanco}</p>
                <p className="text-xs text-ink-muted">En blanco</p>
              </div>
            </div>

            {datos.simulacro.comparativa_anios.length > 0 && (
              <div className="mt-4 border-t border-track pt-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Comparativa con años anteriores
                </p>
                <div className="flex flex-col gap-1.5">
                  {datos.simulacro.comparativa_anios.map((c) => (
                    <div key={c.anio} className="flex items-center justify-between text-sm">
                      <span className="text-ink">Simulacro {c.anio}</span>
                      <span className="font-bold text-ink">
                        {c.puntuacion.toFixed(2)} pts · {c.porcentaje_estimado}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {datos.desglose_especialidad.length > 0 && (
        <section className="mt-6 px-5">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink-muted">
            Por especialidad
          </h2>
          <div className="divide-y divide-track">
            {datos.desglose_especialidad.map((e) => (
              <SpecialtyProgressRow
                key={e.especialidad}
                nombre={e.especialidad}
                porcentaje={e.porcentaje}
                variante="plain"
              />
            ))}
          </div>
        </section>
      )}

      {resumenCargando && (
        <section className="mt-6 px-5">
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            <p className="text-sm text-ink-muted">Analizando tu rendimiento…</p>
          </div>
        </section>
      )}

      {!resumenCargando && tieneContenidoResumen && (
        <section className="mt-6 px-5">
          <div className="rounded-2xl bg-card p-4 shadow-sm">
            {resumen.iaDisponible && resumen.analisisNarrativo && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {resumen.analisisNarrativo}
              </p>
            )}

            {(resumen.etiquetas.fuertes.length > 0 || resumen.etiquetas.debiles.length > 0) && (
              <div
                className={`flex flex-wrap gap-2 ${
                  resumen.iaDisponible && resumen.analisisNarrativo ? "mt-3" : ""
                }`}
              >
                {resumen.etiquetas.fuertes.map((tema) => (
                  <span
                    key={`fuerte-${tema}`}
                    className="rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success-text"
                  >
                    {tema}
                  </span>
                ))}
                {resumen.etiquetas.debiles.map((tema) => (
                  <span
                    key={`debil-${tema}`}
                    className="rounded-full bg-danger-bg px-3 py-1 text-xs font-bold text-danger-text"
                  >
                    {tema}
                  </span>
                ))}
              </div>
            )}

            {resumen.etiquetas.posibleDesactualizacion && (
              <p className="mt-3 rounded-xl bg-warning-bg p-2 text-xs font-semibold text-warning-text">
                Puede que tus fallos se concentren en contenido más reciente: revisa las guías
                actualizadas de tus temas débiles.
              </p>
            )}

            {resumen.desgloseFallos && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-track pt-3">
                <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success-text">
                  🎯 {resumen.desgloseFallos.aciertos} correctas
                </span>
                {resumen.desgloseFallos.controvertidos > 0 && (
                  <Link
                    href="/controversias"
                    className="rounded-full bg-warning-bg px-3 py-1 text-xs font-semibold text-warning-text"
                  >
                    ⚠️ {resumen.desgloseFallos.controvertidos} con respuesta oficial cuestionada
                  </Link>
                )}
                {resumen.desgloseFallos.dificiles > 0 && (
                  <span className="rounded-full bg-track px-3 py-1 text-xs font-semibold text-ink-muted">
                    💡 {resumen.desgloseFallos.dificiles} de alta dificultad
                  </span>
                )}
                {resumen.desgloseFallos.normales > 0 && (
                  <span className="rounded-full bg-danger-bg px-3 py-1 text-xs font-semibold text-danger-text">
                    ❌ {resumen.desgloseFallos.normales} a repasar
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-8 flex gap-3 px-5">
        <button
          type="button"
          onClick={repasarFallos}
          disabled={sinFallos || repasando}
          className="h-14 flex-1 rounded-2xl border-2 border-brand font-bold text-brand disabled:border-track disabled:text-ink-muted"
        >
          {repasando ? "Preparando…" : "Repasar fallos"}
        </button>
        <Link
          href="/inicio"
          className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-brand font-bold text-white active:bg-brand-dark"
        >
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}
