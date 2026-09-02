import pg from "pg";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const LIMITE_PRUEBA = process.argv.includes("--prueba") ? 3 : null;
const CONCURRENCIA = 5;

if (!GROQ_API_KEY) {
  console.error("Falta GROQ_API_KEY en el entorno.");
  process.exit(1);
}

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER || "pir",
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || "pir",
  host: process.env.POSTGRES_HOST || "localhost",
  port: process.env.POSTGRES_PORT || 5432,
});

const SYSTEM_PROMPT = `Eres un experto en Psicología Clínica y opositor al examen PIR.
Vas a recibir una pregunta tipo test del examen PIR, sus opciones, y cuál es
la letra correcta según la plantilla oficial. Escribe una explicación en
español, en un ÚNICO PÁRRAFO (sin títulos, sin markdown, sin saltos de
línea), que:
1. Explique por qué la opción correcta lo es, con razonamiento clínico o
   teórico específico (no te limites a repetir el enunciado).
2. Cierre el mismo párrafo indicando brevemente por qué las demás opciones
   son incorrectas, agrupándolas si comparten el mismo motivo de error.
Tono técnico, preciso, como el de un manual de psicopatología. No uses la
palabra "correcta" más de una vez. No inventes datos, cifras o referencias
que no estén implícitas en la propia pregunta.`;

function construirPrompt(p) {
  return `Pregunta: ${p.pregunta}
A) ${p.opcion_a}
B) ${p.opcion_b}
C) ${p.opcion_c}
D) ${p.opcion_d}
${p.opcion_e ? `E) ${p.opcion_e}\n` : ""}Respuesta correcta: ${p.correcta.trim()}
Tema: ${p.tema || "no especificado"}`;
}

async function generarConGroq(userPrompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        max_tokens: 500,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Groq ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const texto = data?.choices?.[0]?.message?.content?.trim();
    if (!texto) throw new Error("Sin texto en la respuesta");
    return texto;
  } finally {
    clearTimeout(timeout);
  }
}

async function procesarPregunta(p) {
  try {
    const explicacion = await generarConGroq(construirPrompt(p));
    return { id: p.id, explicacion, error: null };
  } catch (err) {
    return { id: p.id, explicacion: null, error: err.message };
  }
}

async function main() {
  const { rows } = await pool.query(`
    SELECT id, año, numero, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, opcion_e, correcta, tema
    FROM preguntas
    WHERE explicacion IS NULL OR explicacion = ''
    ORDER BY id
    ${LIMITE_PRUEBA ? `LIMIT ${LIMITE_PRUEBA}` : ""}
  `);

  console.log(`Procesando ${rows.length} preguntas...`);
  const resultados = [];

  for (let i = 0; i < rows.length; i += CONCURRENCIA) {
    const lote = rows.slice(i, i + CONCURRENCIA);
    const procesados = await Promise.all(lote.map(procesarPregunta));
    resultados.push(...procesados);
    console.log(`  ${Math.min(i + CONCURRENCIA, rows.length)}/${rows.length}`);
  }

  const ok = resultados.filter((r) => !r.error);
  const fallidos = resultados.filter((r) => r.error);

  console.log(`\nOK: ${ok.length} | Fallidos: ${fallidos.length}`);
  if (fallidos.length) {
    console.log("IDs fallidos:", fallidos.map((f) => f.id).join(", "));
  }

  if (LIMITE_PRUEBA) {
    console.log("\n--- MODO PRUEBA: no se escribe en BD, solo muestra resultado ---\n");
    ok.forEach((r) => console.log(`[id ${r.id}]\n${r.explicacion}\n`));
    await pool.end();
    return;
  }

  const fs = await import("fs");
  fs.writeFileSync(
    new URL("./explicaciones_generadas.json", import.meta.url),
    JSON.stringify(ok, null, 2)
  );
  console.log("Guardado en explicaciones_generadas.json");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
