import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getEspecialidadPorSlug,
  getPreguntasPaginadas,
  PREGUNTAS_POR_PAGINA,
} from "../../lib/especialidades";
import ListaPreguntasEspecialidad from "../../components/ListaPreguntasEspecialidad";
import PaginacionEspecialidad from "../../components/PaginacionEspecialidad";

// El build de Dokploy no tiene acceso a mir-db, así que generateStaticParams
// no puede enumerar slugs en build time (devuelve []). Next necesita esta
// función presente -aunque esté vacía- para tratar la ruta como ISR: con
// dynamicParams=true (default) cada slug no listado se renderiza en su
// primera petición y el HTML se cachea `revalidate` segundos, sirviéndose
// cacheado al resto de peticiones sin volver a tocar la BD. Sin
// generateStaticParams, Next ignora `revalidate` y hace SSR puro siempre.
export async function generateStaticParams() {
  return [];
}

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const especialidad = await getEspecialidadPorSlug(params.slug);
  if (!especialidad) return {};

  return {
    title: `Preguntas PIR de ${especialidad.nombre} (${especialidad.anioMin}-${especialidad.anioMax}) – Test Online Gratis | PIR Turel`,
    description: `${especialidad.total} preguntas de ${especialidad.nombre} de las convocatorias PIR ${especialidad.anioMin}–${especialidad.anioMax}. Practica gratis con preguntas oficiales verificadas.`,
    alternates: {
      canonical: `https://pir.turel.es/especialidades/${especialidad.slug}`,
    },
  };
}

export default async function EspecialidadPage({ params }) {
  const especialidad = await getEspecialidadPorSlug(params.slug);
  if (!especialidad) notFound();

  const totalPaginas = Math.max(1, Math.ceil(especialidad.total / PREGUNTAS_POR_PAGINA));
  const preguntas = await getPreguntasPaginadas(especialidad.nombre, 1);

  const schemaCurso = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `Preguntas PIR de ${especialidad.nombre}`,
    description: `${especialidad.total} preguntas oficiales de ${especialidad.nombre} de las convocatorias PIR ${especialidad.anioMin}-${especialidad.anioMax}.`,
    provider: {
      "@type": "Organization",
      name: "PIR Turel",
      url: "https://pir.turel.es",
    },
    url: `https://pir.turel.es/especialidades/${especialidad.slug}`,
    educationalLevel: "Professional",
    inLanguage: "es",
  };

  return (
    <div className="min-h-screen bg-surface px-5 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaCurso) }}
      />
      {/* Next.js hoista cualquier <link> renderizado en la página al <head>
          real del documento — no hace falta pasar por generateMetadata para
          esto (que no tiene un campo dedicado a rel=next/prev). */}
      {totalPaginas > 1 && (
        <link rel="next" href={`https://pir.turel.es/especialidades/${especialidad.slug}/pagina/2`} />
      )}
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-brand">
          ← Volver a inicio
        </Link>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          Preguntas PIR de {especialidad.nombre}
        </h1>

        <p className="mt-4 text-ink-muted">{especialidad.descripcion}</p>

        <p className="mt-4 text-sm font-semibold text-ink-muted">
          {especialidad.total} preguntas disponibles · convocatorias {especialidad.anioMin}–
          {especialidad.anioMax}
        </p>

        <h2 className="mt-10 text-xl font-extrabold text-ink">
          Todas las preguntas de {especialidad.nombre}
        </h2>

        <ListaPreguntasEspecialidad preguntas={preguntas} especialidadSlug={especialidad.slug} />

        <PaginacionEspecialidad
          especialidadSlug={especialidad.slug}
          paginaActual={1}
          totalPaginas={totalPaginas}
        />

        <Link
          href="/registro"
          className="mt-8 flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-center text-lg font-bold text-white shadow-sm active:bg-brand-dark"
        >
          Practica con todas las preguntas → Crear cuenta gratis
        </Link>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-ink-muted"
        >
          ← Volver a la página principal
        </Link>
      </div>
    </div>
  );
}
