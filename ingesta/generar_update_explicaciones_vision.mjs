import fs from "fs";

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const EXCLUIR_ID = 1039; // omeprazol, pendiente de verificación manual del punto de protonación

const todos = JSON.parse(
  fs.readFileSync(
    new URL("./explicaciones_vision_generadas.json", import.meta.url),
    "utf8"
  )
);

const registros = todos.filter((r) => r.id !== EXCLUIR_ID && r.explicacion);
const n = registros.length;

const partes = [];
partes.push("-- UPDATE preguntas.explicacion/explicacion_calidad (pase con modelo de vision, Groq)");
partes.push(`-- Fuente: ingesta/explicaciones_vision_generadas.json (${n} de ${todos.length} registros)`);
partes.push(`-- Excluida id ${EXCLUIR_ID} (omeprazol) a la espera de verificacion manual del punto de`);
partes.push("-- protonacion marcado en la imagen -- no se toca en este UPDATE.");
partes.push("-- Modelos: qwen/qwen3.6-27b (mayoria) y qwen/qwen3.8-27b con reasoning_effort=medium");
partes.push("-- para id 1211 (unico caso que requirio el modelo alternativo, ver revision manual).");
partes.push("");
partes.push("BEGIN;");
partes.push("");
partes.push(`DO $$
DECLARE
  pendientes_antes int;
BEGIN
  SELECT COUNT(*) INTO pendientes_antes
    FROM public.preguntas
    WHERE imagen_path IS NOT NULL AND explicacion IS NULL;
  IF pendientes_antes != ${todos.length} THEN
    RAISE EXCEPTION 'Se esperaban % preguntas con imagen sin explicacion, hay % -- abortando.', ${todos.length}, pendientes_antes;
  END IF;
END $$;`);
partes.push("");
partes.push("UPDATE public.preguntas AS p");
partes.push("SET explicacion = v.explicacion,");
partes.push("    explicacion_calidad = 'vision_ok'");
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
  pendientes_despues int;
  excluida_intacta boolean;
BEGIN
  SELECT COUNT(*) INTO pendientes_despues
    FROM public.preguntas
    WHERE imagen_path IS NOT NULL AND explicacion IS NULL;
  IF pendientes_despues != 1 THEN
    RAISE EXCEPTION 'Se esperaba que solo quedara 1 pendiente (id ${EXCLUIR_ID}), quedan % -- abortando.', pendientes_despues;
  END IF;

  SELECT (explicacion IS NULL) INTO excluida_intacta
    FROM public.preguntas WHERE id = ${EXCLUIR_ID};
  IF NOT excluida_intacta THEN
    RAISE EXCEPTION 'La pregunta excluida (id ${EXCLUIR_ID}) ya no tiene explicacion NULL -- abortando.';
  END IF;

  RAISE NOTICE 'OK: % preguntas actualizadas con vision_ok, id ${EXCLUIR_ID} intacta.', ${n};
END $$;`);
partes.push("");
partes.push("COMMIT;");

fs.writeFileSync(
  new URL("./update_explicaciones_vision.sql", import.meta.url),
  partes.join("\n") + "\n"
);

console.log(`Generado update_explicaciones_vision.sql con ${n} filas (excluida id ${EXCLUIR_ID}).`);
