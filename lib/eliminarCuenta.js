import { pool } from "./db";

// Borrado en cascada de una cuenta y todo su rastro. Se usa tanto desde el
// autoservicio (/api/perfil/cuenta, con sesión) como desde el panel de admin
// (/api/admin/eliminacion-cuenta/[id]/procesar, al tramitar una solicitud
// llegada por /eliminar-cuenta).
export async function eliminarCuentaPorId(userId, email) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM respuestas_sesion WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM sesiones WHERE user_id = $1`, [userId]);
    // lista_espera_premium referencia usuarios(id) sin ON DELETE CASCADE: si
    // se omite, el DELETE de usuarios falla para cualquiera que se haya
    // apuntado alguna vez a la lista de espera de Premium.
    await client.query(`DELETE FROM lista_espera_premium WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM lista_espera WHERE email = $1`, [email]);
    await client.query(`DELETE FROM contacto WHERE email = $1`, [email]);
    await client.query(`DELETE FROM usuarios WHERE id = $1`, [userId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
