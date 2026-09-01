import { generarConGroq } from "./groq";

const SYSTEM_PROMPT = `Eres un asistente educativo para un opositor al examen PIR.
Recibes los temas fuertes y débiles ya calculados (no los calcules tú, ya
vienen dados), junto con estadísticas del test, incluyendo una
clasificación de los fallos por calidad de la explicación oficial. Genera un
análisis narrativo en español para mostrar en móvil, siguiendo estas reglas:

1. Si hay temas fuertes (≥80% de aciertos), menciónalos siempre
   explícitamente por su nombre como fortalezas del usuario. No los omitas.
2. Si hay temas débiles, indícalos con tono constructivo: usa
   expresiones como "área de mejora", "te recomendamos reforzar" o "dedica
   más tiempo a...". No uses nunca palabras como "preocupante", "urgente"
   o "necesidad urgente".
3. Si NO hay ningún tema débil, no inventes ni busques puntos flacos: el
   mensaje debe ser enteramente positivo y de refuerzo.
4. Si hay señal de posible desactualización, menciónala con el mismo tono
   constructivo (p.ej. "conviene repasar las guías más recientes").
5. Si "Fallos por pregunta con respuesta oficial cuestionada" es mayor que 0,
   MENCIONA EXPLÍCITAMENTE que esas preguntas tienen la respuesta oficial
   cuestionada por la comunidad de psicología y que no reflejan el nivel real del
   estudiante — en el PIR real hay que memorizar la plantilla oficial aunque
   contradiga la lógica clínica.
6. Si "Fallos por pregunta de alta dificultad" es mayor que 0, menciona que
   son preguntas de alta dificultad y que fallarlas es señal de estar tocando
   el techo del temario, no un fallo de base.
7. Tono motivador y honesto en todo momento.
8. Máximo 4-5 frases cortas en total.
9. Formato: separa cada frase o idea en su propia línea, con un salto de
   línea "\\n" entre frases. No devuelvas el texto como un único bloque
   continuo pegado.
10. No repitas los porcentajes de forma mecánica en cada frase; intégralos
    de forma natural solo donde aporten.
11. La primera frase NUNCA debe empezar con una negación ni con un enfoque
    negativo (prohibido abrir con "No hay temas fuertes...", "No
    tienes...", etc.). Si no hay temas fuertes, empieza
    directamente mencionando las preguntas controvertidas o de alta
    dificultad como aspecto positivo (p.ej. destacando que abordar ese tipo
    de preguntas ya es un logro), o con cualquier otro enfoque positivo.`;

function construirPromptUsuario({
  totalPreguntas,
  aciertos,
  fallos,
  fallosControvertidos,
  fallosDificiles,
  fallosNormales,
  fuertes,
  debiles,
  posibleDesactualizacion,
}) {
  const lineasFuertes = fuertes.length
    ? fuertes.map((f) => `- ${f.tema}: ${f.porcentaje}% de aciertos`).join("\n")
    : "- (ningún tema alcanza el umbral de dominio en este test)";
  const lineasDebiles = debiles.length
    ? debiles.map((d) => `- ${d.tema}: ${d.porcentaje}% de aciertos`).join("\n")
    : "- (ninguno: no busques ni inventes debilidades, el mensaje debe ser totalmente positivo)";

  return `Datos del test:
- Aciertos: ${aciertos}/${totalPreguntas}
- Fallos por pregunta con respuesta oficial cuestionada: ${fallosControvertidos}
- Fallos por pregunta de alta dificultad: ${fallosDificiles}
- Fallos normales: ${fallosNormales}
- Temas fuertes (≥80%): ${fuertes.length ? fuertes.map((f) => f.tema).join(", ") : "ninguno"}
- Temas débiles (<50%): ${debiles.length ? debiles.map((d) => d.tema).join(", ") : "ninguno"}

Temas fuertes (detalle):
${lineasFuertes}

Temas débiles (detalle):
${lineasDebiles}

Señal de posible desactualización (más fallos en preguntas de exámenes
recientes que en antiguos, dentro de esta misma sesión): ${
    posibleDesactualizacion ? "sí" : "no"
  }

INSTRUCCIONES IMPORTANTES:
1. Si hay fallos_controvertidos > 0, MENCIONA EXPLÍCITAMENTE que esas
   preguntas tienen respuesta oficial cuestionada por la comunidad de psicología y
   que no reflejan el nivel real del estudiante — en el PIR real hay que
   memorizar la plantilla aunque contradiga la lógica clínica.
2. Si hay fallos_dificiles > 0, menciona que son preguntas de alta
   dificultad y que fallarlas es señal de estar tocando el techo del
   temario.
3. Tono motivador y honesto. Máximo 5 frases cortas con saltos de línea
   entre ideas.
4. Menciona los temas fuertes si los hay.
5. Si no hay temas fuertes, empieza directamente mencionando las
   preguntas controvertidas o difíciles como aspecto positivo — nunca abras
   con una negación.`;
}

// El modelo a veces, sobre todo en respuestas más largas (con el bloque de
// controversia/dificultad añadido), escribe la secuencia literal "\n" como
// texto en vez de un salto de línea real. Se normaliza aquí en vez de
// confiar solo en el prompt, que no lo evita de forma consistente.
function normalizarSaltosDeLinea(texto) {
  return texto
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Una única llamada de IA por test, solo Groq (sin fallback a Gemini). Si
// falla por cualquier motivo, la pantalla de resultados debe seguir
// funcionando solo con los datos calculados por código, así que aquí nunca
// se relanza el error: se devuelve texto null.
export async function generarAnalisisNarrativo(datos) {
  const userPrompt = construirPromptUsuario(datos);

  try {
    const texto = await generarConGroq({ systemPrompt: SYSTEM_PROMPT, userPrompt });
    return { texto: normalizarSaltosDeLinea(texto), proveedor: "groq" };
  } catch (errGroq) {
    console.error("resumen-test: fallo Groq, sin análisis narrativo:", errGroq.message);
    return { texto: null, proveedor: null };
  }
}
