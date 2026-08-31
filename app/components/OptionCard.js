export default function OptionCard({
  letra,
  texto,
  modo, // "respondiendo" | "corregido"
  seleccionada,
  esCorrecta,
  esRespuestaUsuario,
  onClick,
}) {
  if (modo === "respondiendo") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
          seleccionada ? "border-brand bg-brand-light" : "border-track bg-card"
        }`}
      >
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            seleccionada ? "bg-brand text-white" : "border border-track text-ink-muted"
          }`}
        >
          {letra}
        </span>
        <span className="pt-0.5 font-medium text-ink">{texto}</span>
      </button>
    );
  }

  // modo === "corregido"
  let estilo = "border-track bg-card";
  let circulo = "border border-track text-ink-muted";
  let badge = null;

  if (esCorrecta) {
    estilo = "border-success bg-success-bg";
    circulo = "bg-success text-white";
    badge = <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-success-text">Correcta</span>;
  } else if (esRespuestaUsuario) {
    estilo = "border-danger bg-danger-bg";
    circulo = "bg-danger text-white";
    badge = <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-danger-text">Tu respuesta</span>;
  }

  return (
    <div className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 ${estilo}`}>
      <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${circulo}`}>
        {letra}
      </span>
      <span className="flex-1 pt-0.5 font-medium text-ink">{texto}</span>
      {badge && <span className="flex-shrink-0 self-center">{badge}</span>}
    </div>
  );
}
