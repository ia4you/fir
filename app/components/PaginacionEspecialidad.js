import Link from "next/link";

// Paginación con URL propia por página (no query string) y enlaces <a>
// reales "Anterior"/"Siguiente" — nada de scroll infinito ni fetch de
// cliente, para que el rastreador siga la cadena de páginas sin ejecutar JS.
function hrefPagina(especialidadSlug, n) {
  return n === 1
    ? `/especialidades/${especialidadSlug}`
    : `/especialidades/${especialidadSlug}/pagina/${n}`;
}

export default function PaginacionEspecialidad({ especialidadSlug, paginaActual, totalPaginas }) {
  if (totalPaginas <= 1) return null;

  return (
    <nav aria-label="Paginación de preguntas" className="mt-6 flex items-center justify-between text-sm font-bold">
      {paginaActual > 1 ? (
        <Link href={hrefPagina(especialidadSlug, paginaActual - 1)} className="text-brand">
          ← Anterior
        </Link>
      ) : (
        <span />
      )}

      <span className="font-semibold text-ink-muted">
        Página {paginaActual} de {totalPaginas}
      </span>

      {paginaActual < totalPaginas ? (
        <Link href={hrefPagina(especialidadSlug, paginaActual + 1)} className="text-brand">
          Siguiente →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
