// Tarjeta de resultado tras responder una pregunta de test (correcto/
// incorrecto + comparación de respuestas + explicación). Mismo diseño que
// el componente equivalente en mir.turel.es: sustituye solo al bloque
// "correcto/incorrecto" del caso normal (hay explicación, sin controversia)
// — las ramas de controversia y sin_imagen/no disponible se quedan fuera de
// este componente, en el padre (app/(shell)/test/[id]/page.js y
// app/(shell)/demo/DemoClient.js), igual que en mir.
//
// porQueFalleExtra recibe el nodo con los sub-estados ya existentes del
// tutor IA (cargando / error+reintentar / respuesta) para que se sigan
// mostrando bajo el botón exactamente como hoy, sin que este componente
// necesite conocer esa lógica.

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4 10-10" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
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

export default function TestFeedback({
  correcta,
  seleccionada,
  textoSeleccionada,
  respuestaCorrectaLetra,
  respuestaCorrectaTexto,
  explicacion,
  onPorQueFalle,
  porQueFalleExtra,
  onSiguiente,
  siguienteLabel = "Siguiente pregunta",
}) {
  const accent = correcta
    ? {
        iconBg: "bg-success",
        iconColor: "text-white",
        label: "text-success-text",
        title: "Correcto",
      }
    : {
        iconBg: "bg-danger",
        iconColor: "text-white",
        label: "text-danger-text",
        title: "Incorrecto",
      };

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-track bg-card">
      {/* Cabecera de estado */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${accent.iconBg} ${accent.iconColor}`}>
            {correcta ? <IconCheck /> : <IconX />}
          </div>
          <span className={`text-lg font-bold ${accent.label}`}>{accent.title}</span>
        </div>
      </div>

      {/* Comparación de respuestas — solo si falló */}
      {!correcta && (
        <div className="flex flex-col gap-2 px-6 pb-5">
          <div className="flex items-center gap-3 rounded-lg bg-danger-bg px-3 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger text-[13px] font-bold text-white">
              {seleccionada || "—"}
            </span>
            <span className="flex-1 text-sm text-danger-text">
              {seleccionada ? textoSeleccionada : "(sin responder — se agotó el tiempo)"}
            </span>
            <span className="whitespace-nowrap text-xs text-danger-text">Tu respuesta</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-success-bg px-3 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-[13px] font-bold text-white">
              {respuestaCorrectaLetra}
            </span>
            <span className="flex-1 text-sm text-success-text">{respuestaCorrectaTexto}</span>
            <span className="whitespace-nowrap text-xs text-success-text">Respuesta correcta</span>
          </div>
        </div>
      )}

      <div className="mx-6 border-t border-track" />

      {/* Explicación */}
      <div className="px-6 py-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Explicación</p>
        <p className="text-sm leading-relaxed text-ink">{explicacion}</p>
      </div>

      {/* Acción secundaria: por qué fallé (+ sus sub-estados existentes).
          onPorQueFalle puede pasar a null/undefined una vez iniciado el
          flujo (para ocultar el botón mientras carga o ya hay respuesta),
          por eso el bloque se mantiene visible con solo porQueFalleExtra. */}
      {!correcta && (onPorQueFalle || porQueFalleExtra) && (
        <div className="px-6 pb-6">
          {onPorQueFalle && (
            <button
              type="button"
              onClick={onPorQueFalle}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-track py-2.5 text-sm font-bold text-ink active:bg-track"
            >
              <IconHelpCircle />
              ¿Por qué he fallado esto?
            </button>
          )}
          {porQueFalleExtra}
        </div>
      )}

      {/* CTA principal — omitible: la demo, en la última pregunta, muestra
          en su lugar un CTA de registro fuera de la tarjeta (onSiguiente
          no se pasa en ese caso). */}
      {onSiguiente && (
        <div className="border-t border-track px-6 py-4">
          <button
            type="button"
            onClick={onSiguiente}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark"
          >
            {siguienteLabel}
            <IconArrowRight />
          </button>
        </div>
      )}
    </div>
  );
}
