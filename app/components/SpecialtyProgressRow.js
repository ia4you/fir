// Umbrales: >70% éxito, 40-70% aviso, <40% peligro.
function colorPorPorcentaje(pct) {
  if (pct > 70) return { dot: "bg-success", bar: "bg-success", text: "text-success" };
  if (pct >= 40) return { dot: "bg-warning", bar: "bg-warning", text: "text-warning" };
  return { dot: "bg-danger", bar: "bg-danger", text: "text-danger" };
}

export default function SpecialtyProgressRow({ nombre, porcentaje, total, variante = "card" }) {
  // Sin preguntas respondidas todavía: estado neutro, no "peligro" (0% en rojo
  // sería engañoso para una especialidad que simplemente no se ha empezado).
  const sinEmpezar = total === 0;
  const color = sinEmpezar
    ? { dot: "bg-track", bar: "bg-track", text: "text-ink-muted" }
    : colorPorPorcentaje(porcentaje);
  const etiqueta = sinEmpezar ? "Sin empezar" : `${porcentaje}%`;

  if (variante === "plain") {
    return (
      <div className="py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink">{nombre}</span>
          <span className={`font-bold ${color.text}`}>{etiqueta}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-track">
          <div
            className={`h-full rounded-full ${color.bar}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
          <span className="font-semibold text-ink">{nombre}</span>
        </div>
        <span className={`font-bold ${sinEmpezar ? "text-ink-muted" : "text-ink"}`}>{etiqueta}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-track">
        <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}
