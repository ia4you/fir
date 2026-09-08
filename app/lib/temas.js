import { query } from "@/lib/db";

// Todo lee de la tabla `temas` (slug, tema, intro, num_preguntas), ya
// poblada con contenido real y única fuente de verdad para /temas,
// /temas/[slug] y sitemap.js.
//
// Guarda defensiva: FIR todavía no tiene esta tabla creada (pendiente de
// la clasificación por tema, ver Fase 4). Mientras tanto estas funciones
// devuelven "sin temas" en vez de reventar /temas, /temas/[slug] y
// sitemap.js con un 500.
function esTablaInexistente(err) {
  return err.code === "42P01"; // undefined_table
}

// `area` no es columna propia de `temas` (solo slug/tema/intro/num_preguntas):
// se deriva del prefijo de `tema` antes de ' - ', igual que preguntas.area,
// para poder agrupar visualmente el índice sin tocar el esquema de `temas`.
export async function getTemasIndice() {
  try {
    const { rows } = await query(
      `SELECT slug, tema, num_preguntas, split_part(tema, ' - ', 1) AS area
       FROM temas
       ORDER BY num_preguntas DESC, tema ASC`
    );
    return rows;
  } catch (err) {
    if (esTablaInexistente(err)) return [];
    throw err;
  }
}

export async function getTemaDetallePorSlug(slug) {
  try {
    const { rows } = await query(
      `SELECT slug, tema, intro, num_preguntas
       FROM temas
       WHERE slug = $1`,
      [slug]
    );
    return rows[0] || null;
  } catch (err) {
    if (esTablaInexistente(err)) return null;
    throw err;
  }
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
