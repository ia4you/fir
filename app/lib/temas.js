import { query } from "@/lib/db";

// Slug URL-safe a partir del nombre de tema tal cual está en BD: minúsculas,
// sin tildes/ñ, cualquier separador (espacios, guiones ya existentes como en
// "Categoría - Subtema") colapsado a un único guion medio. No se persiste en
// BD -- se deriva aquí y en el sitemap con la misma función, así que un slug
// de URL siempre resuelve al mismo tema mientras esta función no cambie.
export function slugifyTema(tema) {
  return tema
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Único punto de verdad para "qué temas existen": agrupa por tema real de
// preguntas y calcula el slug de cada uno. /temas, /temas/[slug] y el
// sitemap parten todos de aquí para no desincronizarse.
export async function getTemasConConteo() {
  const { rows } = await query(
    `SELECT tema, COUNT(*)::int AS n
     FROM preguntas
     GROUP BY tema
     ORDER BY n DESC, tema ASC`
  );
  return rows.map((r) => ({ tema: r.tema, n: r.n, slug: slugifyTema(r.tema) }));
}

export async function getTemaPorSlug(slug) {
  const temas = await getTemasConConteo();
  return temas.find((t) => t.slug === slug) || null;
}

// Vista previa pública: solo enunciado + opciones, nunca `correcta` ni
// `explicacion` -- alguien sin cuenta no debe poder ver la respuesta.
export async function getPreguntasMuestra(tema, limite = 3) {
  const { rows } = await query(
    `SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, opcion_e
     FROM preguntas
     WHERE tema = $1
     ORDER BY random()
     LIMIT $2`,
    [tema, limite]
  );
  return rows;
}
