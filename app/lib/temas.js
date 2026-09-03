import { query } from "@/lib/db";

// Todo lee de la tabla `temas` (slug, tema, intro, num_preguntas), ya
// poblada con contenido real y única fuente de verdad para /temas,
// /temas/[slug] y sitemap.js.

export async function getTemasIndice() {
  const { rows } = await query(
    `SELECT slug, tema, num_preguntas
     FROM temas
     ORDER BY num_preguntas DESC, tema ASC`
  );
  return rows;
}

export async function getTemaDetallePorSlug(slug) {
  const { rows } = await query(
    `SELECT slug, tema, intro, num_preguntas
     FROM temas
     WHERE slug = $1`,
    [slug]
  );
  return rows[0] || null;
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
