"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "../../components/BottomNav";

async function iniciarRepaso({ router, ids, especialidad, onError }) {
  try {
    const resPreguntas = await fetch(`/api/preguntas?ids=${ids.join(",")}`);
    if (!resPreguntas.ok) throw new Error("preguntas");
    const preguntas = await resPreguntas.json();
    if (preguntas.length === 0) throw new Error("sin_preguntas");

    const resSesion = await fetch("/api/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modo: "repaso_errores",
        especialidad: especialidad || null,
        total_preguntas: preguntas.length,
      }),
    });

    if (resSesion.status === 403) {
      const data = await resSesion.json().catch(() => null);
      onError(data?.message || "Has alcanzado tu límite diario de preguntas.");
      return;
    }
    if (!resSesion.ok) throw new Error("sesion");
    const { id } = await resSesion.json();

    sessionStorage.setItem(
      `mir_test_${id}`,
      JSON.stringify({ preguntas, segundosPorPregunta: null })
    );
    router.push(`/test/${id}`);
  } catch (e) {
    onError("No se ha podido preparar el repaso. Inténtalo de nuevo.");
  }
}

export default function MisErrores() {
  const router = useRouter();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [repasando, setRepasando] = useState(null); // null | "todos" | especialidad
  const [errorRepaso, setErrorRepaso] = useState("");

  useEffect(() => {
    fetch("/api/errores")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDatos)
      .catch(() => setError(true));
  }, []);

  function repasar(ids, especialidad, clave) {
    if (ids.length === 0 || repasando) return;
    setErrorRepaso("");
    setRepasando(clave);
    iniciarRepaso({
      router,
      ids,
      especialidad,
      onError: (msg) => {
        setErrorRepaso(msg);
        setRepasando(null);
      },
    });
  }

  const todosLosIds = datos ? datos.grupos.flatMap((g) => g.preguntas.map((p) => p.id)) : [];

  return (
    <div className="min-h-screen pb-28">
      <header className="flex items-center gap-3 px-5 pt-safe">
        <Link
          href="/estadisticas"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-card shadow-sm"
          aria-label="Volver a estadísticas"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-ink">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 5-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold text-ink">Mis errores</h1>
      </header>

      <div className="mt-5 px-5">
        {error && (
          <p className="rounded-2xl bg-card p-4 text-sm text-ink-muted shadow-sm">
            No se han podido cargar tus errores.
          </p>
        )}

        {!error && !datos && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-card shadow-sm" />
            ))}
          </div>
        )}

        {!error && datos && datos.total_preguntas_falladas === 0 && (
          <div className="rounded-2xl bg-card p-4 text-sm text-ink-muted shadow-sm">
            Todavía no has fallado ninguna pregunta. ¡Sigue así!
          </div>
        )}

        {!error && datos && datos.total_preguntas_falladas > 0 && (
          <>
            <div className="rounded-2xl bg-card p-4 shadow-sm">
              <p className="text-sm text-ink-muted">
                Has fallado{" "}
                <span className="font-bold text-danger">{datos.total_preguntas_falladas}</span>{" "}
                {datos.total_preguntas_falladas === 1 ? "pregunta distinta" : "preguntas distintas"}{" "}
                en total.
              </p>
              {errorRepaso && (
                <p className="mt-3 rounded-xl bg-danger-bg p-2 text-xs font-semibold text-danger-text">
                  {errorRepaso}
                </p>
              )}
              <button
                type="button"
                onClick={() => repasar(todosLosIds, null, "todos")}
                disabled={repasando !== null}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-bold text-white shadow-sm active:bg-brand-dark disabled:opacity-60"
              >
                {repasando === "todos" ? "Preparando…" : "Repasar estos errores →"}
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-5">
              {datos.grupos.map((g) => (
                <section key={g.especialidad}>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                      {g.especialidad}
                    </h2>
                    <span className="text-xs font-semibold text-ink-muted">
                      {g.total_preguntas} {g.total_preguntas === 1 ? "pregunta" : "preguntas"}
                    </span>
                  </div>

                  {g.patron && (
                    <div className="mb-3 rounded-xl bg-warning-bg p-3 text-xs font-semibold text-warning-text">
                      ⚠️ Has fallado {g.total_preguntas} preguntas relacionadas con {g.especialidad}.
                    </div>
                  )}

                  <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm">
                    {g.preguntas.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start justify-between gap-3 border-b border-track pb-2.5 last:border-0 last:pb-0"
                      >
                        <p className="line-clamp-2 flex-1 text-sm text-ink">{p.pregunta}</p>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span className="whitespace-nowrap rounded-full bg-danger-bg px-2.5 py-0.5 text-xs font-bold text-danger-text">
                            Fallada {p.veces_fallada}×
                          </span>
                          {p.recurrente && (
                            <span className="whitespace-nowrap rounded-full bg-track px-2.5 py-0.5 text-xs font-bold text-ink-muted">
                              🔁 Recurrente
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        repasar(g.preguntas.map((p) => p.id), g.especialidad, g.especialidad)
                      }
                      disabled={repasando !== null}
                      className="mt-1 h-11 w-full rounded-xl border-2 border-brand text-sm font-bold text-brand disabled:border-track disabled:text-ink-muted"
                    >
                      {repasando === g.especialidad
                        ? "Preparando…"
                        : `Repasar ${g.especialidad} →`}
                    </button>
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
