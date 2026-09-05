import fs from "fs";

function sqlStr(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const registros = JSON.parse(
  fs.readFileSync(new URL("./explicaciones_generadas.json", import.meta.url), "utf8")
);

const n = registros.length;

const partes = [];
partes.push("-- UPDATE preguntas.explicacion (generadas via Groq)");
partes.push(`-- Fuente: ingesta/explicaciones_generadas.json (${n} registros)`);
partes.push("");
partes.push("BEGIN;");
partes.push("");
partes.push(`DO $$
DECLARE
  sin_explicacion_antes int;
BEGIN
  SELECT COUNT(*) INTO sin_explicacion_antes
    FROM public.preguntas WHERE explicacion IS NULL OR explicacion = '';
  IF sin_explicacion_antes != ${n} THEN
    RAISE EXCEPTION 'Se esperaban ${n} preguntas sin explicacion (segun el JSON), hay % -- abortando para no pisar filas con otro motivo.', sin_explicacion_antes;
  END IF;
END $$;`);
partes.push("");
partes.push("UPDATE public.preguntas AS p");
partes.push("SET explicacion = v.explicacion");
partes.push("FROM (VALUES");

const filas = registros.map(
  (r) => `  (${r.id}, ${sqlStr(r.explicacion)})`
);
partes.push(filas.join(",\n"));
partes.push(") AS v(id, explicacion)");
partes.push("WHERE p.id = v.id;");
partes.push("");
partes.push(`DO $$
DECLARE
  sin_explicacion_despues int;
BEGIN
  SELECT COUNT(*) INTO sin_explicacion_despues
    FROM public.preguntas WHERE explicacion IS NULL OR explicacion = '';
  IF sin_explicacion_despues != 0 THEN
    RAISE EXCEPTION '% preguntas se quedaron sin explicacion -- abortando.', sin_explicacion_despues;
  END IF;
  RAISE NOTICE 'OK: 0 preguntas sin explicacion.';
END $$;`);
partes.push("");
partes.push("COMMIT;");

fs.writeFileSync(
  new URL("./update_explicaciones.sql", import.meta.url),
  partes.join("\n") + "\n"
);

console.log(`Generado update_explicaciones.sql con ${n} filas.`);
