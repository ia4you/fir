import { notFound } from "next/navigation";
import Link from "next/link";
import { query } from "@/lib/db";
import { imagenDePost } from "@/lib/blog";
import { getTotalPreguntas } from "../../lib/preguntas";
import BlogHeader from "../../components/BlogHeader";
import BlogImagen from "../../components/BlogImagen";
import Footer from "../../components/Footer";

export const dynamic = "force-dynamic";

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function getPost(slug) {
  const { rows } = await query(
    `SELECT titulo, resumen, contenido, imagen_portada, created_at
     FROM blog_posts
     WHERE slug = $1 AND publicado = true`,
    [slug]
  );
  return rows[0] || null;
}

async function getUltimosPosts(slugActual) {
  const { rows } = await query(
    `SELECT titulo, slug, contenido, imagen_portada, created_at
     FROM blog_posts
     WHERE publicado = true AND slug != $1
     ORDER BY created_at DESC
     LIMIT 4`,
    [slugActual]
  );
  return rows;
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) return {};
  const imagen = imagenDePost(post);
  return {
    title: `${post.titulo} | FIR Turel`,
    description: post.resumen || undefined,
    alternates: { canonical: `https://fir.turel.es/blog/${params.slug}` },
    openGraph: {
      title: post.titulo,
      description: post.resumen || undefined,
      url: `https://fir.turel.es/blog/${params.slug}`,
      images: imagen ? [{ url: imagen }] : undefined,
    },
  };
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const [ultimos, totalPreguntas] = await Promise.all([
    getUltimosPosts(params.slug),
    getTotalPreguntas(),
  ]);
  const imagenHero = post.imagen_portada;
  const textoCta =
    totalPreguntas > 0
      ? `${totalPreguntas.toLocaleString("es-ES")} preguntas FIR oficiales verificadas.`
      : "Preguntas FIR oficiales verificadas.";

  return (
    <div className="min-h-screen bg-surface">
      <BlogHeader />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-12">
        <article className="mx-auto w-full max-w-[700px] lg:mx-0">
          <Link href="/blog" className="text-sm font-bold text-brand">
            ← Volver al blog
          </Link>

          {imagenHero && (
            <div className="mt-4 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenHero}
                alt=""
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          )}

          <h1 className="mt-5 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
            {post.titulo}
          </h1>
          <p className="mt-2 text-sm font-semibold text-ink-muted">
            {formatearFecha(post.created_at)}
          </p>

          <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-ink">
            {post.contenido}
          </div>

          <p className="mt-8 border-t border-track pt-6 text-sm text-ink-muted">
            ¿Preparas el MIR, el EIR o el PIR en vez del FIR? Visita{" "}
            <a
              href="https://mir.turel.es"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand"
            >
              mir.turel.es
            </a>
            , el mismo banco de preguntas oficiales para Medicina.
          </p>
        </article>

        <aside className="mt-10 space-y-6 lg:mt-0">
          <div className="rounded-2xl bg-brand-light p-5 text-center">
            <p className="font-bold text-ink">Empieza gratis hoy</p>
            <p className="mt-1 text-sm text-ink-muted">
              {textoCta}
            </p>
            <Link
              href="/demo"
              className="mt-3 inline-block text-sm font-bold text-brand underline"
            >
              Pruébalo gratis →
            </Link>
          </div>

          {ultimos.length > 0 && (
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-muted">
                Últimos posts
              </p>
              <div className="space-y-3">
                {ultimos.map((u) => (
                  <Link key={u.slug} href={`/blog/${u.slug}`} className="group flex gap-3">
                    <BlogImagen
                      src={imagenDePost(u)}
                      alt=""
                      className="h-14 w-14 flex-shrink-0 rounded-lg"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:text-brand">
                        {u.titulo}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatearFecha(u.created_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <Footer />
    </div>
  );
}
