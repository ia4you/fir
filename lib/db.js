import { Pool } from "pg";

// En desarrollo, Next.js recarga los módulos en caliente y crear un Pool en
// cada recarga agota las conexiones disponibles de Postgres. Se cachea en
// `global` para reutilizar el mismo Pool entre recargas.
const globalForPg = globalThis;

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export function query(text, params) {
  return pool.query(text, params);
}
