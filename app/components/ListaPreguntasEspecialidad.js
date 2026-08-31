import Link from "next/link";

// Listado de preguntas con enlace <a> real a cada una (vía next/link), para
// que Google pueda rastrear /preguntas/[especialidad]/[id] desde un enlace
// interno real y no solo descubrirla en sitemap.xml.
export default function ListaPreguntasEspecialidad({ preguntas, especialidadSlug }) {
  if (!preguntas || preguntas.length === 0) return null;

  return (
    <ol className="mt-4 flex flex-col gap-3">
      {preguntas.map((p) => (
        <li key={p.id} className="rounded-2xl bg-card p-4 shadow-sm">
          <Link
            href={`/preguntas/${especialidadSlug}/${p.id}`}
            className="text-sm font-semibold leading-snug text-ink hover:text-brand"
          >
            {p.pregunta}
          </Link>
        </li>
      ))}
    </ol>
  );
}
