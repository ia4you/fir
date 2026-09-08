import fs from "fs";

function sqlStr(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

// Campos reales del JSON (confirmados antes de escribir esto): tema, slug,
// n, intro, error -- no "num_preguntas", ese es el nombre de la columna SQL
// de destino, no del JSON de origen.
const registros = JSON.parse(
  fs.readFileSync(new URL("./intros_temas_generadas.json", import.meta.url), "utf8")
);

const conError = registros.filter((r) => r.error);
if (conError.length > 0) {
  console.error(`Hay ${conError.length} registros con error, abortando generación.`);
  process.exit(1);
}

registros.sort((a, b) => b.n - a.n || a.tema.localeCompare(b.tema));

const n = registros.length;

const partes = [];
partes.push("-- CREATE + INSERT tabla temas (navegacion publica SEO /temas)");
partes.push(`-- Fuente: ingesta/intros_temas_generadas.json (${n} registros)`);
partes.push("-- Indice por los 66 subtemas finos (columna tema), agrupados visualmente");
partes.push("-- por las 11 areas generales en la UI de /temas -- sin columna area aqui,");
partes.push("-- se deriva con split_part(tema, ' - ', 1) igual que en preguntas.area.");
partes.push("");
partes.push("BEGIN;");
partes.push("");
partes.push(`CREATE TABLE IF NOT EXISTS temas (
  slug TEXT PRIMARY KEY,
  tema TEXT NOT NULL,
  intro TEXT NOT NULL,
  num_preguntas INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`);
partes.push("");
partes.push(`DO $$
DECLARE
  total_antes int;
BEGIN
  SELECT COUNT(*) INTO total_antes FROM public.temas;
  IF total_antes != 0 THEN
    RAISE EXCEPTION 'La tabla temas ya tiene % filas -- abortando para no duplicar.', total_antes;
  END IF;
END $$;`);
partes.push("");
partes.push("INSERT INTO temas (slug, tema, intro, num_preguntas)");
partes.push("VALUES");

const filas = registros.map(
  (r) => `  (${sqlStr(r.slug)}, ${sqlStr(r.tema)}, ${sqlStr(r.intro)}, ${r.n})`
);
partes.push(filas.join(",\n") + ";");

partes.push("");
partes.push(`DO $$
DECLARE
  total_despues int;
  desajustes int;
BEGIN
  SELECT COUNT(*) INTO total_despues FROM public.temas;
  IF total_despues != ${n} THEN
    RAISE EXCEPTION 'Se esperaban ${n} filas en temas, hay % -- abortando.', total_despues;
  END IF;

  -- LEFT JOIN a proposito: un tema sin fila coincidente en preguntas (p.n_real
  -- IS NULL) es tan grave como un num_preguntas desajustado, y debe abortar
  -- igual -- no solo los casos donde SI hay coincidencia pero el numero falla.
  SELECT COUNT(*) INTO desajustes
  FROM public.temas t
  LEFT JOIN (
    SELECT tema, COUNT(*)::int AS n_real
    FROM public.preguntas
    GROUP BY tema
  ) p ON p.tema = t.tema
  WHERE p.n_real IS NULL OR p.n_real != t.num_preguntas;

  IF desajustes != 0 THEN
    RAISE EXCEPTION '% temas tienen num_preguntas desajustado (o sin coincidencia) respecto a preguntas -- abortando.', desajustes;
  END IF;

  RAISE NOTICE 'OK: % filas en temas, num_preguntas cuadra con preguntas para las % coincidencias.', total_despues, ${n};
END $$;`);
partes.push("");
partes.push("COMMIT;");

fs.writeFileSync(
  new URL("./crear_tabla_temas_fir.sql", import.meta.url),
  partes.join("\n") + "\n"
);

console.log(`Generado crear_tabla_temas_fir.sql con ${n} filas en el INSERT.`);
