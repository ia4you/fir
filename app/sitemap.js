import { getEspecialidadesConConteo, getTodasLasPreguntasParaSitemap } from "./lib/especialidades";
import { query } from "@/lib/db";

const BASE_URL = "https://pir.turel.es";

// El build de Dokploy no tiene acceso a mir-db; se genera en cada request
// en vez de prerenderizarse en build time.
export const dynamic = "force-dynamic";

// Solo posts publicados: un borrador no debe indexarse ni aparecer aquí.
async function getPostsBlogParaSitemap() {
  const { rows } = await query(
    `SELECT slug, updated_at, publicado_at
       FROM blog_posts
      WHERE publicado = true`
  );
  return rows;
}

export default async function sitemap() {
  const [especialidades, preguntas, postsBlog] = await Promise.all([
    getEspecialidadesConConteo(),
    getTodasLasPreguntasParaSitemap(),
    getPostsBlogParaSitemap(),
  ]);

  const estaticas = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE_URL}/demo`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE_URL}/blog`, priority: 0.6, changeFrequency: "weekly" },
    { url: `${BASE_URL}/contacto`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${BASE_URL}/aviso-legal`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${BASE_URL}/privacidad`, priority: 0.2, changeFrequency: "yearly" },
    { url: `${BASE_URL}/login`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${BASE_URL}/registro`, priority: 0.3, changeFrequency: "monthly" },
  ];

  const especialidadesUrls = especialidades.map((e) => ({
    url: `${BASE_URL}/especialidades/${e.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  const preguntasUrls = preguntas.map((p) => ({
    url: `${BASE_URL}/preguntas/${p.especialidadSlug}/${p.id}`,
    priority: 0.7,
    changeFrequency: "yearly",
  }));

  const blogUrls = postsBlog.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    priority: 0.6,
    changeFrequency: "monthly",
    lastModified: p.publicado_at || p.updated_at,
  }));

  return [...estaticas, ...especialidadesUrls, ...preguntasUrls, ...blogUrls].map((entry) => ({
    ...entry,
    lastModified: entry.lastModified ?? new Date(),
  }));
}
