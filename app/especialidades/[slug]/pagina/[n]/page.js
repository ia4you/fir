import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getEspecialidadPorSlug,
  getPreguntasPaginadas,
  PREGUNTAS_POR_PAGINA,
} from "../../../../lib/especialidades";
import ListaPreguntasEspecialidad from "../../../../components/ListaPreguntasEspecialidad";
import PaginacionEspecialidad from "../../../../components/PaginacionEspecialidad";

// Mismo patrón ISR que /especialidades/[slug]: el build de Dokploy no tiene
// acceso a mir-db, así que no se pueden enumerar páginas en build time.
export async function generateStaticParams() {
  return [];
}

export const revalidate = 3600;

function paginaValida(n) {
  return Number.isInteger(n) && n >= 1;
}

export async function generateMetadata({ params }) {
  const pagina = parseInt(params.n, 10);
  if (!paginaValida(pagina)) return {};

  const especialidad = await getEspecialidadPorSlug(params.slug);
  if (!especialidad) return {};

  return {
    title: `Preguntas PIR de ${especialidad.nombre} — Página ${pagina} (${especialidad.anioMin}-${especialidad.anioMax}) | PIR Turel`,
    description: `${especialidad.total} preguntas de ${especialidad.nombre} de las convocatorias PIR ${especialidad.anioMin}–${especialidad.anioMax}. Página ${pagina}. Practica gratis con preguntas oficiales verificadas.`,
    alternates: {
      // Autorreferencial a propósito: cada página de la paginación es su
      // propia canonical, no la página 1 — si no, Google nunca indexaría el
      // contenido propio de las páginas 2+ (justo el problema que se está
      // corrigiendo).
      canonical: `https://pir.turel.es/especialidades/${especialidad.slug}/pagina/${pagina}`,
    },
  };
}

export default async function EspecialidadPaginaPage({ params }) {
  const pagina = parseInt(params.n, 10);
  if (!paginaValida(pagina)) notFound();
  // La página 1 vive en /especialidades/[slug] — evita contenido duplicado
  // bajo dos URLs distintas.
  if (pagina === 1) redirect(`/especialidades/${params.slug}`);

  const especialidad = await getEspecialidadPorSlug(params.slug);
  if (!especialidad) notFound();

  const totalPaginas = Math.max(1, Math.ceil(especialidad.total / PREGUNTAS_POR_PAGINA));
  if (pagina > totalPaginas) notFound();

  const preguntas = await getPreguntasPaginadas(especialidad.nombre, pagina);

  return (
    <div className="min-h-screen bg-surface px-5 py-10 sm:py-14">
      {pagina > 1 && (
        <link
          rel="prev"
          href={`https://pir.turel.es/especialidades/${especialidad.slug}${
            pagina - 1 === 1 ? "" : `/pagina/${pagina - 1}`
          }`}
        />
      )}
      {pagina < totalPaginas && (
        <link
          rel="next"
          href={`https://pir.turel.es/especialidades/${especialidad.slug}/pagina/${pagina + 1}`}
        />
      )}

      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-brand">
          ← Volver a inicio
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          Preguntas PIR de {especialidad.nombre}
        </h1>

        <p className="mt-4 text-sm font-semibold text-ink-muted">
          {especialidad.total} preguntas disponibles · convocatorias {especialidad.anioMin}–
          {especialidad.anioMax}
        </p>

        <h2 className="mt-10 text-xl font-extrabold text-ink">
          Todas las preguntas de {especialidad.nombre} — página {pagina}
        </h2>

        <ListaPreguntasEspecialidad preguntas={preguntas} especialidadSlug={especialidad.slug} />

        <PaginacionEspecialidad
          especialidadSlug={especialidad.slug}
          paginaActual={pagina}
          totalPaginas={totalPaginas}
        />

        <Link
          href="/registro"
          className="mt-8 flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-center text-lg font-bold text-white shadow-sm active:bg-brand-dark"
        >
          Practica con todas las preguntas → Crear cuenta gratis
        </Link>

        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-ink-muted">
          ← Volver a la página principal
        </Link>
      </div>
    </div>
  );
}
