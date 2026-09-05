"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import OptionCard from "../../components/OptionCard";
import Footer from "../../components/Footer";

const LETRAS = ["A", "B", "C", "D", "E"];

export default function DemoClient({ totalPreguntas }) {
  const [preguntas, setPreguntas] = useState(null);
  const [error, setError] = useState(false);
  const [indice, setIndice] = useState(0);
  const [seleccionada, setSeleccionada] = useState(null);
  const [estado, setEstado] = useState("respondiendo"); // "respondiendo" | "corregido"
  const [resultado, setResultado] = useState(null);
  const [imagenAmpliada, setImagenAmpliada] = useState(false);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(true);
  const [cerrandoTarjeta, setCerrandoTarjeta] = useState(false);

  useEffect(() => {
    fetch("/api/demo/preguntas?cantidad=6")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar la demo");
        return res.json();
      })
      .then(setPreguntas)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!imagenAmpliada) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setImagenAmpliada(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imagenAmpliada]);

  const preguntaActual = preguntas ? preguntas[indice] : null;
  const esUltima = preguntas ? indice + 1 === preguntas.length : false;

  function confirmarRespuesta() {
    if (!preguntaActual || !seleccionada) return;
    const respuestaCorrecta = preguntaActual.correcta.trim();
    setResultado({
      correcta: seleccionada === respuestaCorrecta,
      respuesta_correcta: respuestaCorrecta,
      explicacion: preguntaActual.explicacion,
      explicacion_calidad: preguntaActual.explicacion_calidad,
    });
    setEstado("corregido");
    setMostrarExplicacion(true);
  }

  function siguientePregunta() {
    setIndice((i) => i + 1);
    setSeleccionada(null);
    setEstado("respondiendo");
    setResultado(null);
    setImagenAmpliada(false);
    setMostrarExplicacion(true);
    setCerrandoTarjeta(false);
  }

  function cerrarExplicacion() {
    setCerrandoTarjeta(true);
  }

  function abrirExplicacion() {
    setMostrarExplicacion(true);
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-ink-muted">No se ha podido cargar la demo. Inténtalo de nuevo.</p>
        <Link href="/" className="text-sm font-bold text-brand">
          ← Volver a inicio
        </Link>
      </div>
    );
  }

  if (!preguntas || !preguntaActual) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink-muted">Cargando demo…</p>
      </div>
    );
  }

  const opciones = LETRAS.map((letra) => ({
    letra,
    texto: preguntaActual[`opcion_${letra.toLowerCase()}`],
  })).filter((o) => o.texto);

  const progreso = ((estado === "corregido" ? indice + 1 : indice) / preguntas.length) * 100;

  const textoCta =
    totalPreguntas > 0
      ? `Regístrate gratis para acceder a las ${totalPreguntas.toLocaleString("es-ES")} preguntas, seguir tu progreso y practicar por tema.`
      : "Regístrate gratis para acceder a todas las preguntas, seguir tu progreso y practicar por tema.";

  const cta = (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-base font-bold text-ink">¡Has completado la demo!</p>
      <p className="text-sm text-ink-muted">{textoCta}</p>
      <Link
        href="/registro"
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark"
      >
        Crear cuenta gratis
      </Link>
      <Link
        href="/premium"
        className="flex h-14 w-full items-center justify-center rounded-2xl border-2 border-brand text-lg font-bold text-brand"
      >
        Ver plan Premium
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen pb-8">
      <header className="flex items-center gap-3 px-5 pt-safe">
        <Link
          href="/"
          aria-label="Salir de la demo"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-ink">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </Link>
        <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-track">
          <div
            className="h-full rounded-full bg-brand-light transition-all"
            style={{ width: `${progreso}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ink">
            Pregunta {indice + 1} de {preguntas.length}
          </span>
        </div>
      </header>

      <main
        className={`mt-5 px-5 ${
          estado === "corregido" && !mostrarExplicacion ? "pb-32" : ""
        }`}
      >
        <span className="inline-block rounded-full bg-badge-bg px-3 py-1 text-sm font-bold text-badge-text">
          {preguntaActual.tema}
        </span>

        <p className="mt-3 text-lg font-medium text-ink">{preguntaActual.pregunta}</p>

        {preguntaActual.imagen_path && (
          <button
            type="button"
            onClick={() => setImagenAmpliada(true)}
            aria-label="Ampliar imagen de la pregunta"
            className="relative mt-4 block w-full"
          >
            <Image
              src={preguntaActual.imagen_path}
              alt="Imagen clínica de la pregunta FIR"
              width={600}
              height={400}
              className="h-auto w-full rounded-lg bg-panel object-contain"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m21 21-4.3-4.3" />
              </svg>
            </span>
          </button>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {opciones.map((o) => (
            <OptionCard
              key={o.letra}
              letra={o.letra}
              texto={o.texto}
              modo={estado}
              seleccionada={seleccionada === o.letra}
              esCorrecta={estado === "corregido" && resultado.respuesta_correcta === o.letra}
              esRespuestaUsuario={estado === "corregido" && seleccionada === o.letra}
              onClick={() => estado === "respondiendo" && setSeleccionada(o.letra)}
            />
          ))}
        </div>

        {estado === "respondiendo" && (
          <div className="mt-6">
            <button
              type="button"
              disabled={!seleccionada}
              onClick={confirmarRespuesta}
              className="h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark disabled:bg-track disabled:text-ink-muted"
            >
              Confirmar respuesta
            </button>
          </div>
        )}
      </main>

      {estado === "corregido" && !mostrarExplicacion && (
        <div className="fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 border-t border-track bg-surface px-5 py-4 pb-safe">
          {esUltima ? (
            cta
          ) : (
            <>
              <button
                type="button"
                onClick={abrirExplicacion}
                className="text-sm font-bold text-ink-muted underline-offset-2 hover:underline"
              >
                Ver explicación
              </button>
              <button
                type="button"
                onClick={siguientePregunta}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark"
              >
                Siguiente pregunta
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {estado === "corregido" && mostrarExplicacion && (
        <div
          key={preguntaActual.id}
          className={`fixed inset-0 z-20 flex flex-col bg-surface ${
            cerrandoTarjeta ? "animate-slide-out-left" : "animate-slide-in-left"
          }`}
          onAnimationEnd={() => {
            if (cerrandoTarjeta) {
              setMostrarExplicacion(false);
              setCerrandoTarjeta(false);
            }
          }}
        >
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-safe">
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-white ${
                    resultado.correcta ? "bg-success" : "bg-danger"
                  }`}
                >
                  {resultado.correcta ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4 10-10" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-6 w-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  )}
                </span>
                <p
                  className={`text-2xl font-extrabold ${
                    resultado.correcta ? "text-success-text" : "text-danger-text"
                  }`}
                >
                  {resultado.correcta ? "CORRECTO" : "INCORRECTO"}
                </p>
              </div>
              {!esUltima && (
                <button
                  type="button"
                  onClick={cerrarExplicacion}
                  aria-label="Cerrar explicación"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-card shadow-sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-ink">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 text-ink">
              <p>
                <span className="font-bold">Respondiste: </span>
                {seleccionada} — {preguntaActual[`opcion_${seleccionada.toLowerCase()}`]}
              </p>
              {!resultado.correcta && (
                <p>
                  <span className="font-bold">Respuesta correcta: </span>
                  {resultado.respuesta_correcta} —{" "}
                  {preguntaActual[`opcion_${String(resultado.respuesta_correcta).toLowerCase()}`]}
                </p>
              )}
            </div>

            <hr className="my-5 border-track" />

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                Explicación
              </p>
              {resultado.explicacion ? (
                <div className="flex flex-col items-start gap-2">
                  {resultado.explicacion_calidad === "controversia" && (
                    <span className="rounded-full bg-danger-bg px-3 py-1 text-xs font-bold text-danger-text">
                      ⚠️ Respuesta oficial cuestionada
                    </span>
                  )}
                  <p className="text-sm leading-relaxed text-ink">{resultado.explicacion}</p>
                  {resultado.explicacion_calidad === "controversia" && (
                    <Link href="/controversias" target="_blank" className="text-sm font-bold text-brand">
                      Ver /controversias →
                    </Link>
                  )}
                </div>
              ) : resultado.explicacion_calidad === "sin_imagen" ? (
                <div className="flex flex-col items-start gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-track px-3 py-1 text-xs font-bold text-ink-muted">
                    🖼️ Sin imagen disponible
                  </span>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Esta pregunta hace referencia a una imagen clínica del examen original.
                    Explicación no disponible.
                  </p>
                </div>
              ) : resultado.explicacion_calidad === "controversia" ? (
                <div className="flex flex-col items-start gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-danger-bg px-3 py-1 text-xs font-bold text-danger-text">
                    ⚠️ Respuesta cuestionada
                  </span>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    La respuesta oficial de esta pregunta ha sido cuestionada.{" "}
                    <Link href="/controversias" target="_blank" className="font-bold text-brand">
                      Ver /controversias
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-track px-3 py-1 text-xs font-bold text-ink-muted">
                    📚 No disponible
                  </span>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Explicación no disponible para esta pregunta.
                  </p>
                </div>
              )}
            </div>

            {esUltima && <hr className="my-5 border-track" />}
          </div>

          <div className="border-t border-track px-5 py-4 pb-safe">
            {esUltima ? (
              cta
            ) : (
              <button
                type="button"
                onClick={siguientePregunta}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark"
              >
                Siguiente pregunta
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {imagenAmpliada && preguntaActual.imagen_path && (
        <div
          className="fixed inset-0 z-40 bg-black/90"
          onClick={() => setImagenAmpliada(false)}
        >
          <button
            type="button"
            onClick={() => setImagenAmpliada(false)}
            aria-label="Cerrar imagen"
            className="absolute right-4 top-safe z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <div className="absolute inset-6" onClick={(e) => e.stopPropagation()}>
            <Image
              src={preguntaActual.imagen_path}
              alt="Imagen clínica de la pregunta FIR"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
