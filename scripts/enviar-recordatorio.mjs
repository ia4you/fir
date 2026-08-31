// Recordatorio diario de racha. Pensado para ejecutarse dentro del propio
// contenedor de la app (vía scripts/enviar_recordatorio.sh + cron en el
// host, con `docker exec`), así que llama a la API interna en localhost y
// abre su propia conexión a Postgres en vez de importar lib/db.js — este
// script lo ejecuta `node` directamente, no el bundler de Next, y
// lib/db.js usa sintaxis ESM que Node solo interpreta así si el paquete
// declara "type": "module" (no es el caso aquí).
import pg from "pg";

const APP_INTERNAL_URL = process.env.APP_INTERNAL_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("Falta CRON_SECRET en el entorno — abortando.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function ayerISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function main() {
  // Solo tiene sentido calcular la racha de usuarios que además tienen
  // alguna suscripción push a la que enviar algo.
  const { rows: usuariosConPush } = await pool.query(
    `SELECT DISTINCT user_id FROM push_subscriptions`
  );
  if (usuariosConPush.length === 0) {
    console.log("Nadie con suscripciones push. Nada que hacer.");
    return;
  }
  const idsConPush = usuariosConPush.map((r) => r.user_id);

  const { rows: diasPorUsuario } = await pool.query(
    `SELECT user_id, DATE(fecha) AS dia
     FROM sesiones
     WHERE user_id = ANY($1::int[])
     GROUP BY user_id, DATE(fecha)
     ORDER BY user_id, dia DESC`,
    [idsConPush]
  );

  const diasDeCadaUsuario = new Map();
  for (const { user_id, dia } of diasPorUsuario) {
    const clave = dia.toISOString().slice(0, 10);
    if (!diasDeCadaUsuario.has(user_id)) diasDeCadaUsuario.set(user_id, new Set());
    diasDeCadaUsuario.get(user_id).add(clave);
  }

  const hoy = hoyISO();
  let notificados = 0;

  for (const userId of idsConPush) {
    const dias = diasDeCadaUsuario.get(userId) || new Set();
    if (dias.has(hoy)) continue; // ya ha jugado hoy, no hace falta avisar

    // Racha activa = días consecutivos jugados terminando ayer.
    let racha = 0;
    const cursor = new Date(`${ayerISO()}T00:00:00Z`);
    for (;;) {
      const clave = cursor.toISOString().slice(0, 10);
      if (dias.has(clave)) {
        racha++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
    }
    if (racha === 0) continue; // no hay racha en riesgo, no molestamos

    try {
      const res = await fetch(`${APP_INTERNAL_URL}/api/push/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": CRON_SECRET },
        body: JSON.stringify({
          user_id: userId,
          title: "🔥 ¡No rompas tu racha!",
          body: `Llevas ${racha} día${racha === 1 ? "" : "s"} seguidos. Practica 10 preguntas hoy.`,
          url: "/inicio",
        }),
      });
      if (res.ok) {
        notificados++;
      } else {
        console.error(`Fallo enviando a user_id=${userId}:`, await res.text());
      }
    } catch (err) {
      console.error(`Error de red enviando a user_id=${userId}:`, err.message);
    }
  }

  console.log(`Recordatorios enviados a ${notificados} usuario(s) con racha en riesgo.`);
}

main()
  .catch((err) => {
    console.error("Error en enviar-recordatorio:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
