// Genera explicaciones oficiales (batch) para preguntas PIR sin
// imagen vía Groq, reutilizando lib/ai/groq.js (config ya corregida:
// max_tokens 900, reasoning_effort "low" — ver notas_precedente_mir.txt).
//
// Cola de trabajo: WHERE explicacion IS NULL AND imagen_path IS NULL. Las
// preguntas con imagen se excluyen a propósito: openai/gpt-oss-20b en Groq
// es solo texto, no tiene visión (quedan pendientes de un pase futuro con
// un modelo con visión).
//
// Reanudable sin fichero de checkpoint aparte: la propia columna
// `explicacion IS NULL` es la cola — re-ejecutar recoge solo lo que falte.
//
// Este sandbox no tiene red directa a pir-db (solo alcanzable dentro de
// dokploy-network); toda lectura/escritura a la BD pasa por
// `docker exec pir-db psql`, igual que en el proyecto EIR precedente.
//
// Uso:
//   node scripts/generar_explicaciones_pir.mjs --test [N]   (por defecto N=8, no toca el resto)
//   node scripts/generar_explicaciones_pir.mjs              (procesa todas las pendientes)

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { generarConGroq } from "../lib/ai/groq.js";

// --- Carga manual de .env.local: este script lo ejecuta `node` directo, no
// Next, así que no hay auto-carga de variables de entorno. ---
function cargarEnv(ruta) {
  const contenido = readFileSync(ruta, "utf8");
  for (const linea of contenido.split("\n")) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
cargarEnv("/root/pir/.env.local");

const DB_CONTAINER = "pir-db";
const DB_USER = "pir";
const DB_NAME = "pir";
const SEP = "\x1f";
const CONCURRENCIA = 3;
const REINTENTOS_MAX = 6;
const LOG_PATH = "/root/pir/ingesta/log_explicaciones.txt";

const idxTest = process.argv.indexOf("--test");
const MODO_TEST = idxTest !== -1;
const LIMITE_TEST = MODO_TEST ? parseInt(process.argv[idxTest + 1], 10) || 8 : null;

function log(linea) {
  console.log(linea);
  appendFileSync(LOG_PATH, linea + "\n");
}

function psqlQuery(sql) {
  const res = spawnSync(
    "docker",
    ["exec", DB_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME, "-t", "-A", "-F", SEP, "-c", sql],
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
  );
  if (res.status !== 0) throw new Error(`psql query falló: ${res.stderr}`);
  return res.stdout;
}

function psqlRun(sql) {
  const res = spawnSync(
    "docker",
    ["exec", "-i", DB_CONTAINER, "psql", "-U", DB_USER, "-d", DB_NAME, "-v", "ON_ERROR_STOP=1"],
    { input: sql, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
  );
  if (res.status !== 0) throw new Error(`psql run falló: ${res.stderr}\n${res.stdout}`);
  return res.stdout;
}

function sqlEscape(s) {
  return s.replace(/'/g, "''");
}

const COLS = ["id", "numero", "especialidad", "pregunta", "opcion_a", "opcion_b", "opcion_c", "opcion_d", "opcion_e", "correcta"];

function getPendientes() {
  const sql = `SELECT ${COLS.join(", ")} FROM preguntas WHERE explicacion IS NULL AND imagen_path IS NULL ORDER BY id`;
  const out = psqlQuery(sql);
  const filas = [];
  for (const linea of out.split("\n")) {
    if (!linea.trim()) continue;
    const partes = linea.split(SEP);
    const fila = {};
    COLS.forEach((c, i) => (fila[c] = partes[i] === "" ? null : partes[i]));
    fila.id = parseInt(fila.id, 10);
    fila.numero = parseInt(fila.numero, 10);
    filas.push(fila);
  }
  return filas;
}

const SYSTEM_PROMPT = `Eres un/a psicólogo/a clínico/a especialista redactando la explicación oficial de una pregunta
del examen PIR (Psicólogo Interno Residente, España). La va a leer cualquier
opositor que responda esta pregunta en una app de estudio, tanto si acierta como
si falla — no es una reacción a un fallo concreto, es la explicación de referencia
de la pregunta.

Reglas:
1. Explica directamente por qué la opción correcta lo es, con el razonamiento
   clínico/psicológico que la sustenta. No repitas el enunciado completo ni la lista
   de opciones — el estudiante ya las tiene delante.
2. Si aporta claridad, menciona brevemente por qué alguna otra opción no es
   correcta — pero no lo hagas por sistema con las cuatro si no aporta nada.
3. Si existe una regla mnemotécnica, acrónimo o asociación de ideas realmente
   conocida y útil para esto, ciérralo con una frase corta con ella. Si no existe
   ninguna de forma natural, NO la inventes ni la fuerces.
4. Máximo 3-5 frases en total, en un ÚNICO párrafo corrido: nunca uses saltos
   de línea entre frases ni una línea por cada opción, aunque el enunciado
   tenga varias partes (varios criterios diagnósticos, varias escalas, etc.) —
   intégralo todo en prosa continua. Nada de listas, nada de markdown, nada de
   encabezados, nada de prefijos tipo "Explicación:".
5. No inventes datos clínicos, cifras o guías que no puedas justificar con
   conocimiento estándar de psicología clínica.
6. Tono directo, profesional y cercano. Nunca condescendiente.`;

function construirUserPrompt(p) {
  const letras = ["a", "b", "c", "d", "e"];
  const opciones = letras
    .filter((l) => p[`opcion_${l}`])
    .map((l) => `${l.toUpperCase()}) ${p[`opcion_${l}`]}`)
    .join("\n");
  const correctaTexto = p[`opcion_${p.correcta.toLowerCase()}`];
  return `Especialidad: ${p.especialidad || "sin especificar"}

Enunciado:
${p.pregunta}

Opciones:
${opciones}

Respuesta correcta: ${p.correcta}) ${correctaTexto}

Redacta la explicación siguiendo las reglas del sistema.`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generarExplicacion(p) {
  const userPrompt = construirUserPrompt(p);
  let ultimoError;
  for (let intento = 1; intento <= REINTENTOS_MAX; intento++) {
    try {
      const inicio = Date.now();
      const texto = await generarConGroq({ systemPrompt: SYSTEM_PROMPT, userPrompt });
      const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
      return { ok: true, texto, segundos };
    } catch (err) {
      ultimoError = err;
      const esRateLimit = /429/.test(err.message);
      if (!esRateLimit || intento === REINTENTOS_MAX) break;
      const match = err.message.match(/try again in ([\d.]+)s/i);
      const esperaMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 1000 : 15000;
      log(`    rate limit (intento ${intento}/${REINTENTOS_MAX}), esperando ${Math.round(esperaMs / 1000)}s…`);
      await sleep(esperaMs);
    }
  }
  return { ok: false, error: ultimoError?.message || "error desconocido" };
}

// Solo entran al UPDATE las preguntas del lote que generaron explicación con
// éxito: si una falla, simplemente no aparece aquí — no aborta ni afecta al
// guardado de las demás del mismo lote.
function guardarLote(resultadosOk) {
  if (resultadosOk.length === 0) return;
  const stmts = ["BEGIN;"];
  for (const r of resultadosOk) {
    stmts.push(`UPDATE preguntas SET explicacion = '${sqlEscape(r.texto)}' WHERE id = ${r.id};`);
  }
  stmts.push("COMMIT;");
  psqlRun(stmts.join("\n"));
}

async function procesarLote(lote, contadores, total) {
  const promesas = lote.map(async (p) => {
    const resultado = await generarExplicacion(p);
    contadores.procesadas++;
    if (resultado.ok) {
      contadores.generadas++;
      log(`[${contadores.procesadas}/${total}] id=${p.id} num=${p.numero} ok (${resultado.segundos}s)`);
      return { id: p.id, texto: resultado.texto };
    } else {
      contadores.errores++;
      log(`[${contadores.procesadas}/${total}] id=${p.id} num=${p.numero} ERROR: ${resultado.error} — se deja NULL, reintentable`);
      return null;
    }
  });
  const resultados = (await Promise.all(promesas)).filter(Boolean);
  guardarLote(resultados);
  if (resultados.length > 0) {
    log(`  [--- lote guardado en BD: ${resultados.length}/${lote.length} ok ---]`);
  }
}

async function main() {
  writeFileSync(LOG_PATH, `=== Ejecución ${new Date().toISOString()} ${MODO_TEST ? `(--test ${LIMITE_TEST})` : "(completa)"} ===\n`);

  let pendientes = getPendientes();
  if (MODO_TEST) pendientes = pendientes.slice(0, LIMITE_TEST);
  const total = pendientes.length;
  log(`Pendientes a procesar: ${total}${MODO_TEST ? ` (modo --test, límite ${LIMITE_TEST})` : ""}`);

  const contadores = { procesadas: 0, generadas: 0, errores: 0 };

  for (let i = 0; i < pendientes.length; i += CONCURRENCIA) {
    const lote = pendientes.slice(i, i + CONCURRENCIA);
    await procesarLote(lote, contadores, total);
  }

  log(`\nCompletado. Procesadas: ${contadores.procesadas} | generadas: ${contadores.generadas} | errores: ${contadores.errores}`);
  if (contadores.errores > 0) {
    log(`Las ${contadores.errores} preguntas con error siguen con explicacion IS NULL — re-ejecutar el script las recoge solas.`);
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exitCode = 1;
});
