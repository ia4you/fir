import { notFound } from "next/navigation";
import Link from "next/link";
import { getTemaDetallePorSlug, getPreguntasMuestra } from "../../lib/temas";
import BlogHeader from "../../components/BlogHeader";
import Footer from "../../components/Footer";

export const dynamic = "force-dynamic";

const LETRAS = ["A", "B", "C", "D", "E"];

// Meta description ideal ronda 150-160 caracteres; el intro real son 3-4
// frases (~500-650 caracteres) pensadas para el cuerpo de la página, no
// para esto -- se resume cortando en el último espacio antes del límite.
function resumirDescription(intro, max = 155) {
  if (intro.length <= max) return intro;
  const corte = intro.slice(0, max).lastIndexOf(" ");
  return intro.slice(0, corte > 0 ? corte : max).trimEnd() + "…";
}

export async function generateMetadata({ params }) {
  const tema = await getTemaDetallePorSlug(params.slug);
  if (!tema) return {};

  const title = `${tema.tema} — Preguntas FIR | FIR Turel`;
  const description = resumirDescription(tema.intro);

  return {
    title,
    description,
    alternates: { canonical: `https://fir.turel.es/temas/${tema.slug}` },
    openGraph: { title, description, url: `https://fir.turel.es/temas/${tema.slug}` },
  };
}

export default async function TemaPage({ params }) {
  const tema = await getTemaDetallePorSlug(params.slug);
  if (!tema) notFound();

  const muestra = await getPreguntasMuestra(tema.tema, 3);

  return (
    <div className="min-h-screen bg-surface">
      <BlogHeader />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <Link href="/temas" className="text-sm font-bold text-brand">
          ← Todos los temas
        </Link>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          {tema.tema}
        </h1>

        <p className="mt-2 text-sm font-semibold text-ink-muted">
          {tema.num_preguntas} preguntas de las convocatorias 2021-2025
        </p>

        <p className="mt-5 text-base leading-relaxed text-ink">{tema.intro}</p>

        <Link
          href="/registro"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark sm:w-auto sm:px-8"
        >
          Practica gratis este tema
        </Link>

        {muestra.length > 0 && (
          <div className="mt-10">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
              Preguntas de muestra
            </p>
            <div className="mt-3 flex flex-col gap-4">
              {muestra.map((p) => {
                const opciones = LETRAS.map((letra) => ({
                  letra,
                  texto: p[`opcion_${letra.toLowerCase()}`],
                })).filter((o) => o.texto);

                return (
                  <div key={p.id} className="rounded-2xl bg-card p-5 shadow-sm">
                    <p className="text-sm font-medium text-ink">{p.pregunta}</p>
                    <div className="mt-3 flex flex-col gap-2">
                      {opciones.map((o) => (
                        <div
                          key={o.letra}
                          className="flex items-start gap-2.5 rounded-xl border border-track px-3 py-2.5 text-sm text-ink"
                        >
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-track text-[11px] font-bold text-ink-muted">
                            {o.letra}
                          </span>
                          {o.texto}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Vista previa — regístrate gratis para ver la respuesta correcta y la
              explicación de cada pregunta.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
