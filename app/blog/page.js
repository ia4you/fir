import Link from "next/link";
import { query } from "@/lib/db";
import { imagenDePost } from "@/lib/blog";
import BlogHeader from "../components/BlogHeader";
import BlogImagen from "../components/BlogImagen";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const metadata = {
  title: "Blog | FIR Turel",
  description: "Artículos sobre preparación del examen FIR, preguntas oficiales y controversias documentadas.",
  alternates: { canonical: "https://fir.turel.es/blog" },
};

export default async function BlogIndex() {
  const { rows: posts } = await query(
    `SELECT id, titulo, slug, resumen, contenido, imagen_portada, created_at
     FROM blog_posts
     WHERE publicado = true
     ORDER BY created_at DESC`
  );

  return (
    <div className="min-h-screen bg-surface">
      <BlogHeader />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold text-ink">Blog de FIR Turel</h1>
        <p className="mt-2 text-ink-muted">
          Novedades de la plataforma, preparación del examen y preguntas oficiales.
        </p>

        {posts.length === 0 ? (
          <p className="mt-10 text-ink-muted">Todavía no hay artículos publicados.</p>
        ) : (
          <div className="mt-8 space-y-4">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="flex gap-4 rounded-2xl bg-card p-4 shadow-sm transition hover:shadow-md sm:gap-5 sm:p-5"
              >
                <BlogImagen
                  src={imagenDePost(p)}
                  alt=""
                  className="h-24 w-24 flex-shrink-0 rounded-xl sm:h-32 sm:w-32"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold leading-snug text-ink sm:text-lg">
                    {p.titulo}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-ink-muted">
                    {formatearFecha(p.created_at)}
                  </p>
                  {p.resumen && (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-muted sm:line-clamp-3">
                      {p.resumen}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
