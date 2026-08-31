import DonutProgress from "./DonutProgress";

export default function ResumenDiario({ racha, metaDiariaPct }) {
  return (
    <section className="grid grid-cols-2 gap-3 px-5">
      <div className="rounded-2xl bg-brand-light p-4">
        <p className="text-3xl font-extrabold text-brand">{racha ?? "—"}</p>
        <p className="mt-2 text-sm font-semibold text-brand">días seguidos</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
        <DonutProgress porcentaje={metaDiariaPct ?? 0} />
        <div>
          <p className="text-2xl font-extrabold text-ink">{metaDiariaPct ?? 0}%</p>
          <p className="text-sm text-ink-muted">meta diaria</p>
        </div>
      </div>
    </section>
  );
}
