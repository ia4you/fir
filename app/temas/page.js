import Link from "next/link";
import { getTemasConConteo } from "../lib/temas";
import BlogHeader from "../components/BlogHeader";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Temas del examen PIR | PIR Turel",
  description:
    "Todos los temas del examen PIR con preguntas oficiales de las convocatorias 2021-2025, ordenados por volumen. Practica gratis por tema.",
  alternates: { canonical: "https://pir.turel.es/temas" },
};

export default async function TemasIndex() {
  const temas = await getTemasConConteo();

  return (
    <div className="min-h-screen bg-surface">
      <BlogHeader />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold text-ink">Temas del examen PIR</h1>
        <p className="mt-2 text-ink-muted">
          {temas.length} temas, con preguntas oficiales verificadas de las convocatorias
          2021 a 2025. Elige uno para practicar.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          {temas.map((t) => (
            <Link
              key={t.slug}
              href={`/temas/${t.slug}`}
              className="flex items-center justify-between gap-4 rounded-2xl bg-card px-5 py-4 shadow-sm transition hover:shadow-md"
            >
              <span className="font-bold text-ink">{t.tema}</span>
              <span className="flex-shrink-0 rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">
                {t.n} preguntas
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
