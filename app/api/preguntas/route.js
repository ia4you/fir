import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Tamaño del Simulacro: no corresponde a ningún año real (el PIR ha tenido
// entre 202 y 208 preguntas útiles según la convocatoria, 210 numeradas
// menos anuladas). Se fija en 205 como muestra representativa, repartida
// proporcionalmente por tema entre las 5 convocatorias disponibles (ver
// generarSimulacro).
const TOTAL_SIMULACRO = 205;

// Reparte TOTAL_SIMULACRO preguntas entre temas según su peso medio
// histórico (% que representa cada tema en cada convocatoria disponible,
// tratando como 0% los años en que no tuvo preguntas), con redondeo por
// "mayor resto" para que la suma cuadre exacto.
function repartoPorMayorResto(pesos, total) {
  const crudos = pesos.map((p) => ({
    tema: p.tema,
    exacto: (parseFloat(p.pct_medio) * total) / 100,
  }));
  let asignado = 0;
  const reparto = crudos.map((c) => {
    const base = Math.floor(c.exacto);
    asignado += base;
    return { tema: c.tema, cantidad: base, resto: c.exacto - base };
  });
  const faltan = total - asignado;
  reparto
    .slice()
    .sort((a, b) => b.resto - a.resto)
    .slice(0, faltan)
    .forEach((r) => {
      reparto.find((x) => x.tema === r.tema).cantidad += 1;
    });
  return reparto;
}

function barajar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Simulacro: combina los años disponibles en un único examen de
// TOTAL_SIMULACRO preguntas, repartidas por tema según su peso histórico
// real (no una selección aleatoria simple sobre todo el banco).
async function generarSimulacro() {
  const { rows: pesos } = await query(`
    WITH anios AS (SELECT DISTINCT año FROM preguntas),
         temas AS (SELECT DISTINCT tema FROM preguntas),
         combinaciones AS (
           SELECT a.año, t.tema FROM anios a CROSS JOIN temas t
         ),
         conteos AS (
           SELECT c.año, c.tema, COALESCE(p.cnt, 0) AS num_preguntas
           FROM combinaciones c
           LEFT JOIN (
             SELECT año, tema, COUNT(*) AS cnt FROM preguntas GROUP BY año, tema
           ) p ON p.año = c.año AND p.tema = c.tema
         ),
         totales_año AS (SELECT año, SUM(num_preguntas) AS total FROM conteos GROUP BY año),
         pcts AS (
           SELECT c.año, c.tema, c.num_preguntas * 100.0 / t.total AS pct
           FROM conteos c JOIN totales_año t ON t.año = c.año
         )
    SELECT tema, AVG(pct) AS pct_medio
    FROM pcts
    GROUP BY tema
  `);

  const reparto = repartoPorMayorResto(pesos, TOTAL_SIMULACRO);

  const porTema = await Promise.all(
    reparto
      .filter((r) => r.cantidad > 0)
      .map((r) =>
        query(
          `SELECT id, año, numero, tema, pregunta,
                  opcion_a, opcion_b, opcion_c, opcion_d, opcion_e, imagen_path
           FROM preguntas
           WHERE tema IS NOT DISTINCT FROM $1
           ORDER BY RANDOM()
           LIMIT $2`,
          [r.tema, r.cantidad]
        )
      )
  );

  return barajar(porTema.flatMap((r) => r.rows));
}

// Nunca se selecciona la columna `correcta` aquí: la respuesta correcta solo
// se consulta en el backend, en /api/sesiones/[id]/respuestas, al corregir.
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tema = searchParams.get("tema");
  const temasParam = searchParams.get("temas");
  const anioParam = searchParams.get("anio");
  const cantidadParam = searchParams.get("cantidad");
  const idsParam = searchParams.get("ids");
  const modo = searchParams.get("modo");
  // "original" devuelve las preguntas en su orden real de examen (por
  // número) en vez del orden aleatorio por defecto. Ya no lo usa el
  // Simulacro (ahora mezcla años/temas vía modo=simulacro).
  const orden = searchParams.get("orden") === "original" ? "original" : "random";

  if (modo === "simulacro") {
    try {
      const preguntas = await generarSimulacro();
      return NextResponse.json(preguntas);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Error al generar el simulacro" }, { status: 500 });
    }
  }

  // Modo "repaso": pide un listado exacto de preguntas por id (p.ej. las
  // falladas de una sesión anterior), ignorando el resto de filtros y sin
  // orden aleatorio.
  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((v) => parseInt(v.trim(), 10))
      .filter(Number.isInteger);
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids inválido" }, { status: 400 });
    }
    try {
      const { rows } = await query(
        `SELECT id, año, numero, tema, pregunta,
                opcion_a, opcion_b, opcion_c, opcion_d, opcion_e, imagen_path
         FROM preguntas
         WHERE id = ANY($1::int[])`,
        [ids]
      );
      return NextResponse.json(rows);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Error al consultar preguntas" }, { status: 500 });
    }
  }

  const cantidad = cantidadParam ? parseInt(cantidadParam, 10) : 10;
  if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 210) {
    return NextResponse.json(
      { error: "cantidad debe ser un entero entre 1 y 210" },
      { status: 400 }
    );
  }

  let anio = null;
  if (anioParam) {
    anio = parseInt(anioParam, 10);
    if (!Number.isInteger(anio)) {
      return NextResponse.json({ error: "anio inválido" }, { status: 400 });
    }
  }

  const condiciones = [];
  const valores = [];
  // `temas` (plural, coma-separada) permite mezclar varios en un mismo test
  // (p.ej. "entrenar puntos débiles"); si viene, tiene prioridad sobre
  // `tema` (singular).
  const listaTemas = temasParam
    ? temasParam.split(",").map((v) => v.trim()).filter(Boolean)
    : [];
  if (listaTemas.length > 0) {
    valores.push(listaTemas);
    condiciones.push(`tema = ANY($${valores.length}::text[])`);
  } else if (tema) {
    valores.push(tema);
    condiciones.push(`tema = $${valores.length}`);
  }
  if (anio !== null) {
    valores.push(anio);
    condiciones.push(`año = $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const orderBy = orden === "original" ? "numero ASC" : "RANDOM()";
  valores.push(cantidad);

  try {
    const { rows } = await query(
      `SELECT id, año, numero, tema, pregunta,
              opcion_a, opcion_b, opcion_c, opcion_d, opcion_e, imagen_path
       FROM preguntas
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${valores.length}`,
      valores
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al consultar preguntas" }, { status: 500 });
  }
}
