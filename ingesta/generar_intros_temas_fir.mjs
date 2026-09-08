import pg from "pg";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const MODO_PRUEBA = process.argv.includes("--prueba");
const CONCURRENCIA = 5;

if (!GROQ_API_KEY) {
  console.error("Falta GROQ_API_KEY en el entorno.");
  process.exit(1);
}

const pool = new pg.Pool({
  user: process.env.POSTGRES_USER || "fir",
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || "fir",
  host: process.env.POSTGRES_HOST || "localhost",
  port: process.env.POSTGRES_PORT || 5432,
});

// Misma función que app/lib/temas.js (duplicada a propósito: este script
// corre fuera del build de Next, no puede importar del árbol de la app).
function slugifyTema(tema) {
  return tema
    .replace(/ñ/g, "n")
    .replace(/Ñ/g, "N")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SYSTEM_PROMPT = `Eres un redactor SEO especializado en oposiciones sanitarias, escribiendo
para FIR Turel (plataforma de preparación del examen FIR de Farmacia).
Vas a recibir el nombre de un tema del temario FIR y cuántas preguntas
oficiales tiene disponibles. Escribe un párrafo introductorio en español,
de 3-4 frases (60-90 palabras aproximadamente), en un ÚNICO PÁRRAFO sin
markdown ni títulos, que:
1. Explique brevemente qué abarca ese tema dentro del temario FIR (qué
   tipo de contenido incluye, por qué es relevante para el examen).
2. Mencione de forma natural (no forzada) que hay preguntas reales de
   convocatorias oficiales anteriores disponibles para practicar.
Tono: profesional, cercano, sin superlativos vacíos ('el mejor', 'increíble').
No repitas literalmente el nombre del tema más de una vez. No inventes
datos, cifras o afirmaciones sobre el examen que no puedas justificar.
Si mencionas el nombre del tema textualmente, usa siempre guion corto normal
('-'), nunca guion largo ni en dash ('–'), incluso en temas compuestos tipo
'Categoría - Subtema'.`;

function construirPrompt(t) {
  return `Tema: ${t.tema}
Preguntas oficiales disponibles: ${t.n}`;
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
        max_tokens: 300,
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

// Detecta los dos incumplimientos del SYSTEM_PROMPT observados en la
// prueba inicial: guion largo/en dash (pedido explícitamente evitar) y
// desviarse del rango de palabras objetivo (60-90, con margen 50-100).
function violaFormato(texto) {
  if (/[–—]/.test(texto)) return true;
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  return palabras < 50 || palabras > 100;
}

async function procesarTema(t) {
  try {
    let intro = await generarConGroq(construirPrompt(t));
    let intentos = 1;
    while (violaFormato(intro) && intentos < 3) {
      intentos++;
      intro = await generarConGroq(construirPrompt(t));
    }
    if (violaFormato(intro)) {
      throw new Error("Incumple formato (guion largo o fuera de 50-100 palabras) tras 3 intentos");
    }
    return { tema: t.tema, slug: t.slug, n: t.n, intro, error: null };
  } catch (err) {
    return { tema: t.tema, slug: t.slug, n: t.n, intro: null, error: err.message };
  }
}

async function main() {
  const soloTemasArg = process.argv.find((a) => a.startsWith("--solo-temas="));
  const soloTemas = soloTemasArg
    ? soloTemasArg.slice("--solo-temas=".length).split("|")
    : null;

  const { rows } = await pool.query(`
    SELECT tema, COUNT(*)::int AS n
    FROM preguntas
    GROUP BY tema
    ORDER BY n DESC, tema ASC
  `);
  const temas = rows.map((r) => ({ tema: r.tema, n: r.n, slug: slugifyTema(r.tema) }));

  // Modo prueba: 3 temas repartidos por volumen (alto/medio/bajo), no los
  // 3 primeros por conteo -- para que la muestra sea representativa.
  const seleccion = MODO_PRUEBA
    ? [temas[0], temas[Math.floor(temas.length / 2)], temas[temas.length - 1]]
    : soloTemas
      ? temas.filter((t) => soloTemas.includes(t.tema))
      : temas;

  console.log(`Procesando ${seleccion.length} temas...`);
  const resultados = [];

  for (let i = 0; i < seleccion.length; i += CONCURRENCIA) {
    const lote = seleccion.slice(i, i + CONCURRENCIA);
    const procesados = await Promise.all(lote.map(procesarTema));
    resultados.push(...procesados);
    console.log(`  ${Math.min(i + CONCURRENCIA, seleccion.length)}/${seleccion.length}`);
  }

  const ok = resultados.filter((r) => !r.error);
  const fallidos = resultados.filter((r) => r.error);

  console.log(`\nOK: ${ok.length} | Fallidos: ${fallidos.length}`);
  if (fallidos.length) {
    console.log("Temas fallidos:", fallidos.map((f) => f.tema).join(", "));
  }

  if (MODO_PRUEBA) {
    console.log("\n--- MODO PRUEBA: no se escribe nada, solo muestra resultado ---\n");
    ok.forEach((r) => {
      console.log(`[${r.tema}] (${r.n} preguntas, slug=${r.slug})`);
      console.log(`${r.intro}`);
      console.log(`(${r.intro.split(/\s+/).length} palabras)\n`);
    });
    await pool.end();
    return;
  }

  const fs = await import("fs");
  const outFile = new URL("./intros_temas_generadas.json", import.meta.url);
  let salida = ok;
  if (soloTemas) {
    const previo = JSON.parse(fs.readFileSync(outFile, "utf8"));
    const porTema = new Map(ok.map((r) => [r.tema, r]));
    const yaEstaban = new Set(previo.map((r) => r.tema));
    salida = [
      ...previo.map((r) => porTema.get(r.tema) || r),
      ...ok.filter((r) => !yaEstaban.has(r.tema)),
    ];
  }
  fs.writeFileSync(outFile, JSON.stringify(salida, null, 2));
  console.log("Guardado en intros_temas_generadas.json");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
