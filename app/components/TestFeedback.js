import Link from "next/link";

// Tarjeta de resultado tras responder una pregunta de test (correcto/
// incorrecto + comparación de respuestas + explicación + tutor IA). Ocupa el
// panel de contenido a pantalla completa que se desliza desde la izquierda
// en app/(shell)/test/[id]/page.js — ese wrapper (fixed inset-0 + animación
// de entrada/salida) se queda en page.js, este componente es solo su
// contenido interior.
//
// La rama de resultado.controversia se pasa tal cual (JSX sin rediseñar):
// en FIR no existe ninguna fuente de datos para ella (ni columna en
// preguntas ni tabla controversias), así que nunca se activa en producción,
// pero se conserva por si se implementa como funcionalidad real más
// adelante.

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4 10-10" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconCerrar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconImagenNoDisponible() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 17 5-5 4 4 3-3 4 4" />
      <path strokeLinecap="round" d="M3 3l18 18" />
    </svg>
  );
}

function IconNoDisponible() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 11h1v5" />
    </svg>
  );
}

function IconHelpCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
      <path strokeLinecap="round" d="M12 17h.01" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function FilaRespuesta({ tono, letra, texto, etiqueta }) {
  const estilos = {
    success: { fila: "bg-success-bg", badge: "bg-success", texto: "text-success-text" },
    danger: { fila: "bg-danger-bg", badge: "bg-danger", texto: "text-danger-text" },
    neutro: { fila: "bg-panel", badge: "bg-track", texto: "text-ink-muted" },
  }[tono];

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${estilos.fila}`}>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${estilos.badge}`}
      >
        {letra}
      </span>
      <span className={`flex-1 text-sm ${estilos.texto}`}>{texto}</span>
      <span className={`whitespace-nowrap text-xs ${estilos.texto}`}>{etiqueta}</span>
    </div>
  );
}

export default function TestFeedback({
  correcta,
  seleccionada,
  textoSeleccionada,
  respuestaCorrectaLetra,
  respuestaCorrectaTexto,
  explicacion,
  explicacionCalidad,
  controversia,
  tutorFallo,
  tutorFalloCargando,
  tutorFalloError,
  onPedirTutorFallo,
  onCerrar,
  onSiguiente,
  siguienteLabel,
}) {
  const accent = correcta
    ? { iconBg: "bg-success", label: "text-success-text", borde: "border-l-success", titulo: "Correcto" }
    : { iconBg: "bg-danger", label: "text-danger-text", borde: "border-l-danger", titulo: "Incorrecto" };

  return (
    <div className={`flex h-full flex-col border-l-[3px] ${accent.borde}`}>
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-safe">
        {/* Cabecera de estado */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${accent.iconBg}`}
            >
              {correcta ? <IconCheck /> : <IconX />}
            </span>
            <p className={`text-lg font-bold ${accent.label}`}>{accent.titulo}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar explicación"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-sm"
          >
            <IconCerrar />
          </button>
        </div>

        {/* Comparación de respuestas */}
        <div className="mt-5 flex flex-col gap-2">
          {seleccionada === null ? (
            <FilaRespuesta
              tono="neutro"
              letra="—"
              texto="Sin responder — se agotó el tiempo"
              etiqueta="Tu respuesta"
            />
          ) : (
            <FilaRespuesta
              tono={correcta ? "success" : "danger"}
              letra={seleccionada}
              texto={textoSeleccionada}
              etiqueta="Tu respuesta"
            />
          )}
          {!correcta && (
            <FilaRespuesta
              tono="success"
              letra={respuestaCorrectaLetra}
              texto={respuestaCorrectaTexto}
              etiqueta="Respuesta correcta"
            />
          )}
        </div>

        <hr className="my-5 border-track" />

        {/* Explicación */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
            {controversia ? "Respuesta cuestionada" : "Explicación"}
          </p>
          {controversia ? (
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
                  {controversia.respuesta_oficial.letra} — {controversia.respuesta_oficial.texto}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-warning-text">
                  🟡 Respuesta alternativa defendible
                </p>
                <p className="mt-1 text-sm text-ink">
                  {controversia.respuesta_recomendada
                    ? `${controversia.respuesta_recomendada.letra} — ${controversia.respuesta_recomendada.texto}`
                    : "No se identifica una única alternativa clara — ver motivo de la discrepancia."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  📚 Motivo de la discrepancia
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {controversia.motivo || "Respuesta cuestionada — sin detalle documentado."}
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
          ) : explicacion ? (
            <p className="text-sm leading-relaxed text-ink">{explicacion}</p>
          ) : explicacionCalidad === "sin_imagen" ? (
            <div className="flex flex-col items-start gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-track px-3 py-1 text-xs font-bold text-ink-muted">
                <IconImagenNoDisponible />
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
                <IconNoDisponible />
                No disponible
              </span>
              <p className="text-sm leading-relaxed text-ink-muted">
                Explicación no disponible para esta pregunta.
              </p>
            </div>
          )}
        </div>

        {/* Tutor IA — mismo tratamiento tipográfico y botón secundario que el
            resto de la tarjeta; la lógica (pedirTutorFallo y sus 3 estados)
            vive en el padre, aquí solo se dibuja. */}
        {!correcta && !controversia && (
          <div className="mt-5 border-t border-track pt-4">
            {!tutorFallo && !tutorFalloCargando && (
              <button
                type="button"
                onClick={onPedirTutorFallo}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-track py-2.5 text-sm font-bold text-ink active:bg-track"
              >
                <IconHelpCircle />
                ¿Por qué he fallado esto?
              </button>
            )}

            {tutorFalloCargando && (
              <p className="text-sm text-ink-muted">Analizando tu fallo…</p>
            )}

            {tutorFalloError && !tutorFalloCargando && (
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-danger-text">{tutorFalloError}</p>
                <button type="button" onClick={onPedirTutorFallo} className="text-sm font-bold text-brand">
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
      </div>

      {/* CTA principal */}
      <div className="border-t border-track px-5 py-4 pb-safe">
        <button
          type="button"
          onClick={onSiguiente}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark"
        >
          {siguienteLabel}
          <IconArrowRight />
        </button>
      </div>
    </div>
  );
}
