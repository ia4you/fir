import Link from "next/link";
import { getTemasIndice } from "../lib/temas";
import BlogHeader from "../components/BlogHeader";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Temas del examen FIR | FIR Turel",
  description:
    "Todos los temas del examen FIR con preguntas oficiales de las convocatorias 2021-2025, ordenados por volumen. Practica gratis por tema.",
  alternates: { canonical: "https://fir.turel.es/temas" },
};

// Agrupa visualmente los 66 subtemas bajo sus 11 áreas (sin tocar el
// modelo de datos: `temas` no tiene columna `area`, ya viene derivada por
// getTemasIndice() con split_part). Los grupos se ordenan por volumen total
// de preguntas descendente, igual que ya se ordenan los subtemas sueltos;
// dentro de cada grupo se conserva el orden que ya trae la query.
function agruparPorArea(temas) {
  const porArea = new Map();
  for (const t of temas) {
    if (!porArea.has(t.area)) porArea.set(t.area, []);
    porArea.get(t.area).push(t);
  }
  return [...porArea.entries()]
    .map(([area, temasDelArea]) => ({
      area,
      totalPreguntas: temasDelArea.reduce((sum, t) => sum + t.num_preguntas, 0),
      temas: temasDelArea,
    }))
    .sort((a, b) => b.totalPreguntas - a.totalPreguntas);
}

export default async function TemasIndex() {
  const temas = await getTemasIndice();
  const grupos = agruparPorArea(temas);

  return (
    <div className="min-h-screen bg-surface">
      <BlogHeader />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold text-ink">Temas del examen FIR</h1>
        <p className="mt-2 text-ink-muted">
          {temas.length} temas, con preguntas oficiales verificadas de las convocatorias
          2021 a 2025. Elige uno para practicar.
        </p>

        <div className="mt-8 flex flex-col gap-8">
          {grupos.map((g) => (
            <div key={g.area}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                {g.area}
              </h2>
              <div className="mt-3 flex flex-col gap-2">
                {g.temas.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/temas/${t.slug}`}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-card px-5 py-4 shadow-sm transition hover:shadow-md"
                  >
                    <span className="font-bold text-ink">{t.tema}</span>
                    <span className="flex-shrink-0 rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">
                      {t.num_preguntas} preguntas
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
