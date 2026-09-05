"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import OptionCard from "../../../components/OptionCard";
import TestFeedback from "../../../components/TestFeedback";

const LETRAS = ["A", "B", "C", "D", "E"];

function formatearTiempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Temporizador global del simulacro (horas:minutos:segundos), distinto del
// formatearTiempo por pregunta que solo llega a minutos.
function formatearTiempoLargo(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TestPregunta({ params }) {
  const router = useRouter();
  const sesionId = params.id;

  const [preguntas, setPreguntas] = useState(null);
  const [segundosPorPregunta, setSegundosPorPregunta] = useState(null);
  const [modoExamen, setModoExamen] = useState("practica"); // "practica" | "simulacro"
  const [segundosTotales, setSegundosTotales] = useState(null);
  const [indice, setIndice] = useState(0);
  const [seleccionada, setSeleccionada] = useState(null);
  const [estado, setEstado] = useState("respondiendo"); // "respondiendo" | "corregido"
  const [resultado, setResultado] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [tiempoTotalRestante, setTiempoTotalRestante] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [tutorFallo, setTutorFallo] = useState(null);
  const [tutorFalloCargando, setTutorFalloCargando] = useState(false);
  const [tutorFalloError, setTutorFalloError] = useState("");
  const [mostrarSalir, setMostrarSalir] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(false);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(true);
  const [cerrandoTarjeta, setCerrandoTarjeta] = useState(false);

  const horaInicioRef = useRef(null);
  const mostrarSalirRef = useRef(false);
  useEffect(() => {
    mostrarSalirRef.current = mostrarSalir;
  }, [mostrarSalir]);

  // Contador de aciertos en un ref (no en estado): en modo simulacro se
  // necesita su valor actualizado en la misma pasada async en la que se
  // registra la última respuesta, antes de que React vuelva a renderizar.
  const aciertosRef = useRef(0);
  // Evita que el aviso de "se acabó el tiempo" se dispare dos veces si el
  // intervalo llega a 0 justo cuando ya se estaba confirmando una respuesta.
  const finalizandoPorTiempoRef = useRef(false);

  useEffect(() => {
    if (!imagenAmpliada) return;
    function onKeyDown(e) {
      if (e.key === "Escape") setImagenAmpliada(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imagenAmpliada]);

  useEffect(() => {
    const guardado = sessionStorage.getItem(`mir_test_${sesionId}`);
    if (!guardado) {
      router.replace("/configuracion");
      return;
    }
    const datos = JSON.parse(guardado);
    setPreguntas(datos.preguntas);
    setSegundosPorPregunta(datos.segundosPorPregunta);
    setModoExamen(datos.modoExamen || "practica");
    setSegundosTotales(datos.segundosTotales || null);
    horaInicioRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesionId]);

  const preguntaActual = preguntas ? preguntas[indice] : null;

  // Sin useCallback a propósito: en modo simulacro esta función llama a
  // siguientePregunta() más abajo, y ambas necesitan cerrar siempre sobre el
  // indice/preguntas/seleccionada MÁS RECIENTES (memoizarla con dependencias
  // parciales arriesgaría capturar un indice desactualizado).
  async function confirmarRespuesta(respuestaForzada) {
    if (!preguntaActual || enviando) return;
    setEnviando(true);
    const respuestaFinal = respuestaForzada !== undefined ? respuestaForzada : seleccionada;
    let data;
    try {
      const res = await fetch(`/api/sesiones/${sesionId}/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta_id: preguntaActual.id, respuesta_dada: respuestaFinal }),
      });
      data = await res.json();
    } catch (e) {
      data = { correcta: false, respuesta_correcta: "-", explicacion: null };
    }
    if (data.correcta) aciertosRef.current += 1;
    setEnviando(false);

    // Simulacro: sin corrección ni interrupciones durante el test — se pasa
    // directamente a la siguiente pregunta (o se finaliza si era la última).
    if (modoExamen === "simulacro") {
      await siguientePregunta();
      return;
    }

    setResultado(data);
    setEstado("corregido");
    setMostrarExplicacion(true);
  }

  // Temporizador por pregunta
  useEffect(() => {
    if (!preguntaActual || estado !== "respondiendo" || !segundosPorPregunta) {
      setTiempoRestante(null);
      return;
    }
    setTiempoRestante(segundosPorPregunta);
    const intervalo = setInterval(() => {
      if (mostrarSalirRef.current) return; // pausado mientras se confirma la salida
      setTiempoRestante((t) => (t === null ? null : Math.max(0, t - 1)));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [indice, estado, segundosPorPregunta, preguntaActual]);

  useEffect(() => {
    if (tiempoRestante === 0 && estado === "respondiendo") {
      confirmarRespuesta(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiempoRestante]);

  // Temporizador global del simulacro (240 min para todo el test, no por
  // pregunta). Se basa en horaInicioRef en vez de restar 1 en cada tick para
  // no desincronizarse si el intervalo se pausa (pestaña en segundo plano).
  useEffect(() => {
    if (modoExamen !== "simulacro" || !segundosTotales || !preguntas) return;
    function tick() {
      const transcurridos = Math.round((Date.now() - horaInicioRef.current) / 1000);
      const restante = Math.max(0, segundosTotales - transcurridos);
      setTiempoTotalRestante(restante);
      if (restante <= 0) {
        clearInterval(intervalo);
        finalizarPorTiempoRef.current();
      }
    }
    tick();
    const intervalo = setInterval(tick, 1000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoExamen, segundosTotales, preguntas]);

  async function finalizarSesion() {
    const duracionSegundos = Math.round((Date.now() - horaInicioRef.current) / 1000);
    await fetch(`/api/sesiones/${sesionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aciertos: aciertosRef.current, duracion_segundos: duracionSegundos }),
    }).catch(() => {});
    sessionStorage.removeItem(`mir_test_${sesionId}`);
    router.push(`/resultados/${sesionId}`);
  }

  async function siguientePregunta() {
    if (indice + 1 < preguntas.length) {
      setIndice((i) => i + 1);
      setSeleccionada(null);
      setEstado("respondiendo");
      setResultado(null);
      setImagenAmpliada(false);
      setMostrarExplicacion(true);
      setCerrandoTarjeta(false);
      setTutorFallo(null);
      setTutorFalloError("");
      return;
    }
    await finalizarSesion();
  }

  async function pedirTutorFallo() {
    if (tutorFalloCargando || !preguntaActual) return;
    setTutorFalloError("");
    setTutorFalloCargando(true);
    try {
      const res = await fetch(`/api/preguntas/${preguntaActual.id}/tutor-fallo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuesta_dada: seleccionada }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTutorFallo(data.analisis);
    } catch (e) {
      setTutorFalloError("No se ha podido generar la explicación. Inténtalo de nuevo.");
    } finally {
      setTutorFalloCargando(false);
    }
  }

  // Cuando se acaba el tiempo del simulacro, las preguntas no vistas cuentan
  // como en blanco (sin penalización) en vez de quedar sin registrar.
  async function finalizarPorTiempo() {
    if (finalizandoPorTiempoRef.current) return;
    finalizandoPorTiempoRef.current = true;
    const restantes = preguntas.slice(indice);
    for (let i = 0; i < restantes.length; i++) {
      const pregunta = restantes[i];
      const esActual = i === 0;
      if (esActual && enviando) continue; // ya se está confirmando desde otro sitio
      const respuestaDada = esActual ? seleccionada : null;
      try {
        const res = await fetch(`/api/sesiones/${sesionId}/respuestas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pregunta_id: pregunta.id, respuesta_dada: respuestaDada }),
        });
        const data = await res.json().catch(() => null);
        if (data?.correcta) aciertosRef.current += 1;
      } catch (e) {
        // seguimos con las siguientes preguntas aunque una falle
      }
    }
    await finalizarSesion();
  }

  // "Última versión" de finalizarPorTiempo en una ref: el efecto del
  // temporizador global solo se registra una vez, así que necesita poder
  // invocar siempre la versión más reciente (con el indice/preguntas al día)
  // en vez de la que existía cuando arrancó el intervalo.
  const finalizarPorTiempoRef = useRef(() => {});
  finalizarPorTiempoRef.current = finalizarPorTiempo;

  function salir() {
    sessionStorage.removeItem(`mir_test_${sesionId}`);
    router.push("/inicio");
  }

  function cerrarExplicacion() {
    setCerrandoTarjeta(true);
  }

  function abrirExplicacion() {
    setMostrarExplicacion(true);
  }

  if (!preguntas || !preguntaActual) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink-muted">Cargando test…</p>
      </div>
    );
  }

  const opciones = LETRAS.map((letra) => ({
    letra,
    texto: preguntaActual[`opcion_${letra.toLowerCase()}`],
  })).filter((o) => o.texto);

  const progreso = ((estado === "corregido" ? indice + 1 : indice) / preguntas.length) * 100;

  return (
    <div className="min-h-screen pb-8">
      <header className="flex items-center gap-3 px-5 pt-safe">
        <button
          type="button"
          onClick={() => setMostrarSalir(true)}
          aria-label="Salir del test"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-ink">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {/* Barra de progreso de preguntas: gruesa y con el texto integrado, para
            que no se confunda visualmente con el chip del temporizador. */}
        <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-track">
          <div
            className="h-full rounded-full bg-brand-light transition-all"
            style={{ width: `${progreso}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ink">
            Pregunta {indice + 1} de {preguntas.length}
          </span>
        </div>
        {estado === "respondiendo" && segundosPorPregunta && tiempoRestante !== null && (
          <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-brand-light px-3 py-1.5 text-sm font-bold text-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
            {formatearTiempo(tiempoRestante)}
          </span>
        )}
        {modoExamen === "simulacro" && tiempoTotalRestante !== null && (
          <span
            className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${
              tiempoTotalRestante <= 300 ? "bg-danger-bg text-danger-text" : "bg-brand-light text-brand"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
            {formatearTiempoLargo(tiempoTotalRestante)}
          </span>
        )}
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
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={!seleccionada || enviando}
              onClick={() => confirmarRespuesta()}
              className="h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark disabled:bg-track disabled:text-ink-muted"
            >
              {enviando ? "Enviando…" : "Confirmar respuesta"}
            </button>
            {modoExamen === "simulacro" && (
              <button
                type="button"
                disabled={enviando}
                onClick={() => confirmarRespuesta(null)}
                className="h-12 w-full rounded-2xl border-2 border-track text-sm font-bold text-ink-muted active:bg-track disabled:opacity-60"
              >
                Dejar en blanco →
              </button>
            )}
          </div>
        )}
      </main>

      {estado === "corregido" && !mostrarExplicacion && (
        <div className="fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 border-t border-track bg-surface px-5 py-4 pb-safe">
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
            {indice + 1 < preguntas.length ? "Siguiente pregunta" : "Ver resultados"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
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
            {!resultado.controversia && resultado.explicacion ? (
              // Caso normal: tarjeta rediseñada (TestFeedback, mismo diseño
              // que mir). Controversia y sin_imagen/no-disponible siguen con
              // el markup propio de FIR, sin tocar, fuera del componente.
              <>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={cerrarExplicacion}
                    aria-label="Cerrar explicación"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex justify-center">
                  <TestFeedback
                    correcta={resultado.correcta}
                    seleccionada={seleccionada}
                    textoSeleccionada={
                      seleccionada ? preguntaActual[`opcion_${seleccionada.toLowerCase()}`] : null
                    }
                    respuestaCorrectaLetra={resultado.respuesta_correcta}
                    respuestaCorrectaTexto={
                      preguntaActual[`opcion_${String(resultado.respuesta_correcta).toLowerCase()}`]
                    }
                    explicacion={resultado.explicacion}
                    onPorQueFalle={!tutorFallo && !tutorFalloCargando ? pedirTutorFallo : undefined}
                    porQueFalleExtra={
                      <>
                        {tutorFalloCargando && (
                          <p className="mt-3 text-sm text-ink-muted">Analizando tu fallo…</p>
                        )}
                        {tutorFalloError && !tutorFalloCargando && (
                          <div className="mt-3 flex flex-col items-start gap-2">
                            <p className="text-sm text-danger-text">{tutorFalloError}</p>
                            <button
                              type="button"
                              onClick={pedirTutorFallo}
                              className="text-sm font-bold text-brand"
                            >
                              Reintentar
                            </button>
                          </div>
                        )}
                        {tutorFallo && (
                          <div className="mt-3 rounded-xl bg-brand-light p-3">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand">
                              🎓 Tutor IA — ¿por qué he fallado esto?
                            </p>
                            <p className="text-sm leading-relaxed text-ink">{tutorFallo}</p>
                          </div>
                        )}
                      </>
                    }
                    onSiguiente={siguientePregunta}
                    siguienteLabel={indice + 1 < preguntas.length ? "Siguiente pregunta" : "Ver resultados"}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                        resultado.correcta ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {resultado.correcta ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4 10-10" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      )}
                    </span>
                    <p className={`text-lg font-bold ${resultado.correcta ? "text-success-text" : "text-danger-text"}`}>
                      {resultado.correcta ? "Correcto" : "Incorrecto"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={cerrarExplicacion}
                    aria-label="Cerrar explicación"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  {seleccionada === null ? (
                    <div className="flex items-center gap-3 rounded-lg bg-panel px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-track text-[13px] font-bold text-white">
                        —
                      </span>
                      <span className="flex-1 text-sm text-ink-muted">Sin responder — se agotó el tiempo</span>
                      <span className="whitespace-nowrap text-xs text-ink-muted">Tu respuesta</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${resultado.correcta ? "bg-success-bg" : "bg-danger-bg"}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${resultado.correcta ? "bg-success" : "bg-danger"}`}>
                        {seleccionada}
                      </span>
                      <span className={`flex-1 text-sm ${resultado.correcta ? "text-success-text" : "text-danger-text"}`}>
                        {preguntaActual[`opcion_${seleccionada.toLowerCase()}`]}
                      </span>
                      <span className={`whitespace-nowrap text-xs ${resultado.correcta ? "text-success-text" : "text-danger-text"}`}>
                        Tu respuesta
                      </span>
                    </div>
                  )}
                  {!resultado.correcta && (
                    <div className="flex items-center gap-3 rounded-lg bg-success-bg px-3 py-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-[13px] font-bold text-white">
                        {resultado.respuesta_correcta}
                      </span>
                      <span className="flex-1 text-sm text-success-text">
                        {preguntaActual[`opcion_${String(resultado.respuesta_correcta).toLowerCase()}`]}
                      </span>
                      <span className="whitespace-nowrap text-xs text-success-text">Respuesta correcta</span>
                    </div>
                  )}
                </div>

                <hr className="my-5 border-track" />

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                    {resultado.controversia ? "Respuesta cuestionada" : "Explicación"}
                  </p>
                  {resultado.controversia ? (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl border border-warning-border bg-warning-bg p-3 text-xs text-warning-text">
                        ⚠️ Las explicaciones de esta sección reflejan análisis clínico basado en
                        literatura médica. La respuesta válida en el examen FIR es siempre la de la
                        plantilla oficial del Ministerio de Sanidad.
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-danger-text">
                          🔴 Respuesta oficial Ministerio
                        </p>
                        <p className="mt-1 text-sm text-ink">
                          {resultado.controversia.respuesta_oficial.letra} —{" "}
                          {resultado.controversia.respuesta_oficial.texto}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-warning-text">
                          🟡 Respuesta alternativa defendible
                        </p>
                        <p className="mt-1 text-sm text-ink">
                          {resultado.controversia.respuesta_recomendada
                            ? `${resultado.controversia.respuesta_recomendada.letra} — ${resultado.controversia.respuesta_recomendada.texto}`
                            : "No se identifica una única alternativa clara — ver motivo de la discrepancia."}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                          📚 Motivo de la discrepancia
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {resultado.controversia.motivo || "Respuesta cuestionada — sin detalle documentado."}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                          🎯 Consejo para el examen
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          En el FIR debes marcar la respuesta oficial aunque la evidencia clínica
                          pueda apuntar a otra dirección.
                        </p>
                      </div>

                      <Link href="/controversias" target="_blank" className="text-sm font-bold text-brand">
                        Ver todas las controversias →
                      </Link>
                    </div>
                  ) : resultado.explicacion_calidad === "sin_imagen" ? (
                    <div className="flex flex-col items-start gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-track px-3 py-1 text-xs font-bold text-ink-muted">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="9" cy="10" r="1.3" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4 17 5-5 4 4 3-3 4 4" />
                          <path strokeLinecap="round" d="M3 3l18 18" />
                        </svg>
                        Sin imagen disponible
                      </span>
                      <p className="text-sm leading-relaxed text-ink-muted">
                        Esta pregunta hace referencia a una imagen clínica del examen original.
                        Explicación no disponible.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-track px-3 py-1 text-xs font-bold text-ink-muted">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" d="M12 8h.01" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 11h1v5" />
                        </svg>
                        No disponible
                      </span>
                      <p className="text-sm leading-relaxed text-ink-muted">
                        Explicación no disponible para esta pregunta.
                      </p>
                    </div>
                  )}
                </div>

                {!resultado.correcta && !resultado.controversia && (
                  <div className="mt-5 border-t border-track pt-4">
                    {!tutorFallo && !tutorFalloCargando && (
                      <button
                        type="button"
                        onClick={pedirTutorFallo}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-track py-2.5 text-sm font-bold text-ink active:bg-track"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <circle cx="12" cy="12" r="9" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
                          <path strokeLinecap="round" d="M12 17h.01" />
                        </svg>
                        ¿Por qué he fallado esto?
                      </button>
                    )}

                    {tutorFalloCargando && (
                      <p className="text-sm text-ink-muted">Analizando tu fallo…</p>
                    )}

                    {tutorFalloError && !tutorFalloCargando && (
                      <div className="flex flex-col items-start gap-2">
                        <p className="text-sm text-danger-text">{tutorFalloError}</p>
                        <button type="button" onClick={pedirTutorFallo} className="text-sm font-bold text-brand">
                          Reintentar
                        </button>
                      </div>
                    )}

                    {tutorFallo && (
                      <div className="rounded-xl bg-brand-light p-3">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand">
                          🎓 Tutor IA — ¿por qué he fallado esto?
                        </p>
                        <p className="text-sm leading-relaxed text-ink">{tutorFallo}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {(resultado.controversia || !resultado.explicacion) && (
            <div className="border-t border-track px-5 py-4 pb-safe">
              <button
                type="button"
                onClick={siguientePregunta}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark"
              >
                {indice + 1 < preguntas.length ? "Siguiente pregunta" : "Ver resultados"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          )}
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
          <div
            className="absolute inset-6"
            onClick={(e) => e.stopPropagation()}
          >
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

      {mostrarSalir && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-card p-5 shadow-lg">
            <p className="text-lg font-bold text-ink">¿Salir del test?</p>
            <p className="mt-1 text-sm text-ink-muted">
              Perderás el progreso de esta sesión y no se guardará el resultado.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setMostrarSalir(false)}
                className="h-11 flex-1 rounded-xl border border-track font-bold text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salir}
                className="h-11 flex-1 rounded-xl bg-danger font-bold text-white"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
