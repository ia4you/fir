import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getPreguntaPublica,
  getSiguientePregunta,
  getTotalPreguntasYEspecialidades,
} from "../../../lib/especialidades";

// Igual que /especialidades/[slug]: el build de Dokploy no tiene acceso a
// mir-db, así que generateStaticParams no puede enumerar preguntas en build
// time (devuelve []). Con dynamicParams=true (default) cada id no listado
// se renderiza en su primera petición y el HTML se cachea `revalidate`
// segundos.
export async function generateStaticParams() {
  return [];
}

export const revalidate = 3600;

const LETRAS = ["a", "b", "c", "d", "e"];

function primerasPalabras(texto, n) {
  return texto.trim().split(/\s+/).slice(0, n).join(" ");
}

export async function generateMetadata({ params }) {
  const pregunta = await getPreguntaPublica(params.especialidad, params.id);
  if (!pregunta) return {};

  const url = `https://pir.turel.es/preguntas/${pregunta.especialidadSlug}/${pregunta.id}`;
  const description = pregunta.pregunta.slice(0, 150);
  const titulo = `Pregunta PIR de ${pregunta.especialidad} ${pregunta.año} – ${primerasPalabras(pregunta.pregunta, 5)} | PIR Turel`;

  return {
    title: titulo,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: titulo,
      description,
      url,
      siteName: "PIR Turel",
    },
  };
}

export default async function PreguntaPublicaPage({ params }) {
  const pregunta = await getPreguntaPublica(params.especialidad, params.id);
  if (!pregunta) notFound();

  // Encadena las preguntas de una misma especialidad con un enlace real
  // (id ascendente), para repartir enlazado interno más allá de las que ya
  // aparecen en el listado de /especialidades/[slug].
  const siguiente = await getSiguientePregunta(pregunta.especialidad, pregunta.id);
  const { totalPreguntas } = await getTotalPreguntasYEspecialidades();
  const textoCta =
    totalPreguntas > 0
      ? `Practica con ${totalPreguntas.toLocaleString("es-ES")} preguntas oficiales → Crear cuenta gratis`
      : "Practica con preguntas oficiales → Crear cuenta gratis";

  return (
    <div className="min-h-screen bg-surface px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-brand">
          ← Volver a inicio
        </Link>

        <span className="mt-4 inline-block rounded-full bg-badge-bg px-3 py-1 text-sm font-bold text-badge-text">
          {pregunta.especialidad}
        </span>

        <h1 className="mt-4 text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
          {pregunta.pregunta}
        </h1>

        {pregunta.imagen_path && (
          <div className="relative mt-5 h-64 w-full overflow-hidden rounded-2xl bg-panel sm:h-80">
            <Image
              src={pregunta.imagen_path}
              alt={`Imagen clínica de la pregunta de ${pregunta.especialidad}`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 672px"
            />
          </div>
        )}

        <ul className="mt-6 flex flex-col gap-3">
          {LETRAS.map((letra) => {
            const opcion = pregunta[`opcion_${letra}`];
            if (!opcion || !opcion.trim()) return null;
            return (
              <li
                key={letra}
                className="flex items-start gap-3 rounded-2xl border-2 border-track bg-card p-4"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-track text-sm font-bold text-ink-muted">
                  {letra.toUpperCase()}
                </span>
                <span className="pt-0.5 font-medium text-ink">{opcion}</span>
              </li>
            );
          })}
        </ul>

        {pregunta.explicacion && pregunta.explicacion.trim() && (
          <div className="mt-6 rounded-2xl bg-panel p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
              Explicación clínica
            </p>
            {/* No se muestra el texto real de `explicacion`: gran parte de
                los textos terminan revelando la letra correcta en prosa
                ("C es la respuesta correcta"), lo que anularía el gancho de
                registro de esta página. Solo se usa como señal de que SÍ
                existe explicación para esta pregunta (teaser). */}
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Esta pregunta incluye una explicación clínica completa paso a paso.{" "}
              <Link href="/registro" className="font-bold text-brand">
                Crea tu cuenta gratis
              </Link>{" "}
              para verla junto con la corrección.
            </p>
          </div>
        )}

        <Link
          href="/registro"
          className="mt-8 flex h-14 items-center justify-center rounded-2xl bg-brand px-6 text-center text-lg font-bold text-white shadow-sm active:bg-brand-dark"
        >
          {textoCta}
        </Link>

        <Link
          href={`/especialidades/${pregunta.especialidadSlug}`}
          className="mt-6 block text-center text-sm font-semibold text-brand"
        >
          Ver más preguntas de {pregunta.especialidad} →
        </Link>

        {siguiente && (
          <Link
            href={`/preguntas/${pregunta.especialidadSlug}/${siguiente.id}`}
            className="mt-3 block text-center text-sm font-semibold text-ink-muted hover:text-brand"
          >
            Siguiente pregunta de {pregunta.especialidad} →
          </Link>
        )}
      </div>
    </div>
  );
}
