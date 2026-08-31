// Umbrales del nivel: 🟢 ≥75% dominado, 🟡 50-74% en progreso, 🔴 <50% flojo.
// Distintos de los umbrales de SpecialtyProgressRow (70/40) a propósito: esta
// tabla usa el criterio pedido para el dashboard mejorado.
function nivel(porcentaje, total) {
  if (total === 0) return { emoji: "⚪", texto: "Sin empezar" };
  if (porcentaje >= 75) return { emoji: "🟢", texto: "Dominado" };
  if (porcentaje >= 50) return { emoji: "🟡", texto: "En progreso" };
  return { emoji: "🔴", texto: "Flojo" };
}

const TENDENCIA = {
  up: { icono: "↑", clase: "text-success" },
  down: { icono: "↓", clase: "text-danger" },
  flat: { icono: "→", clase: "text-ink-muted" },
};

export default function EspecialidadesStatsTable({ especialidades }) {
  if (!especialidades || especialidades.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
      <table className="w-full min-w-[420px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-track text-xs font-bold uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-3">Especialidad</th>
            <th className="px-4 py-3">% Aciertos</th>
            <th className="px-4 py-3">Tendencia</th>
            <th className="px-4 py-3">Nivel</th>
          </tr>
        </thead>
        <tbody>
          {especialidades.map((e) => {
            const { emoji, texto } = nivel(e.porcentaje, e.total);
            const t = TENDENCIA[e.total >= 4 ? e.tendencia : "flat"];
            return (
              <tr key={e.especialidad} className="border-b border-track last:border-0">
                <td className="px-4 py-3 font-semibold text-ink">{e.especialidad}</td>
                <td className="px-4 py-3 font-bold text-ink">
                  {e.total > 0 ? `${e.porcentaje}%` : "—"}
                </td>
                <td className={`px-4 py-3 text-base font-bold ${t.clase}`}>
                  {e.total >= 4 ? t.icono : "—"}
                </td>
                <td className="px-4 py-3">
                  <span title={texto}>
                    {emoji} <span className="text-ink-muted">{texto}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
