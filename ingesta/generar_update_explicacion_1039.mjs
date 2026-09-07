import fs from "fs";

function sqlStr(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const ID = 1039; // omeprazol, verificado manualmente el punto de protonación (posición D)

const todos = JSON.parse(
  fs.readFileSync(
    new URL("./explicaciones_vision_generadas.json", import.meta.url),
    "utf8"
  )
);
const registro = todos.find((r) => r.id === ID);
if (!registro || !registro.explicacion) {
  throw new Error(`No se encontró explicacion para id ${ID} en explicaciones_vision_generadas.json`);
}

const partes = [];
partes.push("-- UPDATE preguntas.explicacion/explicacion_calidad para id 1039 (omeprazol)");
partes.push("-- Excluida del lote de 19 anterior a la espera de verificación manual del punto de");
partes.push("-- protonación marcado en la imagen (posición D = nitrógeno imínico del benzimidazol,");
partes.push("-- confirmado visualmente) -- ahora incorporada con el mismo patrón vision_ok.");
partes.push("");
partes.push("BEGIN;");
partes.push("");
partes.push(`DO $$
DECLARE
  estado_antes record;
BEGIN
  SELECT explicacion IS NULL AS sin_explicacion, explicacion_calidad INTO estado_antes
    FROM public.preguntas WHERE id = ${ID};
  IF NOT estado_antes.sin_explicacion OR estado_antes.explicacion_calidad IS DISTINCT FROM 'sin_imagen' THEN
    RAISE EXCEPTION 'Estado inesperado en id ${ID} antes del UPDATE (explicacion no nula o calidad != sin_imagen) -- abortando.';
  END IF;
END $$;`);
partes.push("");
partes.push("UPDATE public.preguntas");
partes.push(`SET explicacion = ${sqlStr(registro.explicacion)},`);
partes.push("    explicacion_calidad = 'vision_ok'");
partes.push(`WHERE id = ${ID};`);
partes.push("");
partes.push(`DO $$
DECLARE
  estado_despues record;
BEGIN
  SELECT explicacion IS NOT NULL AS con_explicacion, explicacion_calidad INTO estado_despues
    FROM public.preguntas WHERE id = ${ID};
  IF NOT estado_despues.con_explicacion OR estado_despues.explicacion_calidad IS DISTINCT FROM 'vision_ok' THEN
    RAISE EXCEPTION 'id ${ID} no quedó con explicacion + vision_ok tras el UPDATE -- abortando.';
  END IF;
  RAISE NOTICE 'OK: id ${ID} actualizada con vision_ok.';
END $$;`);
partes.push("");
partes.push("COMMIT;");

fs.writeFileSync(
  new URL("./update_explicacion_1039.sql", import.meta.url),
  partes.join("\n") + "\n"
);

console.log("Generado update_explicacion_1039.sql");
