import { query } from "../../lib/db";

// Cifra real para el marketing copy (hero, metadata, CTAs). Mientras la
// tabla esté vacía, totalPreguntas viene a 0 y cada sitio que lo usa cae a
// un texto de fallback sin cifra en vez de mostrar "0 preguntas".
export async function getTotalPreguntas() {
  const { rows } = await query(`SELECT COUNT(*)::int AS total FROM preguntas`);
  return rows[0].total;
}
