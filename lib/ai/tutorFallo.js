import { generarConGroq } from "./groq";

const SYSTEM_PROMPT = `Eres un tutor de psicología para un opositor al examen PIR (España).
El estudiante acaba de fallar una pregunta tipo test. Tu tarea es ayudarle a
entender POR QUÉ falló y a que no vuelva a cometer el mismo error, con el
tono cercano y didáctico de un residente mayor explicando a un R1.

Reglas estrictas:
1. Si el estudiante marcó una opción (no la dejó en blanco), identifica qué
   concepto confundió: empieza con una frase del tipo "Has confundido X con
   Y porque..." (adapta X e Y al contenido real de la pregunta), explicando
   la diferencia clave entre lo que eligió y lo correcto.
2. Si la dejó en blanco (sin respuesta), no uses la fórmula de "has
   confundido"; en su lugar explica en una frase la idea clave que hace que
   la opción correcta lo sea.
3. Después, ofrece SIEMPRE un truco mnemotécnico corto y práctico (regla
   mnemotécnica, acrónimo o asociación de ideas) para recordar la diferencia
   o el concepto en el futuro.
4. Máximo 3-4 frases en total. Nada de listas, nada de markdown, nada de
   encabezados.
5. No repitas literalmente el enunciado completo de la pregunta ni todas las
   opciones — el estudiante ya las tiene delante.
6. No inventes datos clínicos que no se puedan justificar por el contenido de
   la pregunta o la explicación oficial, si se te proporciona.
7. Tono didáctico, cercano y directo. Nunca condescendiente.`;

function construirPromptUsuario({
  pregunta,
  especialidad,
  opciones,
  respuestaDada,
  respuestaCorrecta,
  explicacionOficial,
}) {
  const textoElegido = respuestaDada ? opciones[respuestaDada] : null;
  const textoCorrecta = opciones[respuestaCorrecta];

  return `Especialidad: ${especialidad || "sin especificar"}

Enunciado de la pregunta:
${pregunta}

Opción marcada por el estudiante: ${
    respuestaDada ? `${respuestaDada}) ${textoElegido}` : "(la dejó en blanco, no marcó ninguna)"
  }
Opción correcta: ${respuestaCorrecta}) ${textoCorrecta}
${explicacionOficial ? `Explicación oficial de referencia: ${explicacionOficial}` : ""}

Genera el análisis siguiendo las reglas del sistema.`;
}

// A diferencia de generarAnalisisNarrativo, esta función SÍ propaga el error:
// se invoca bajo demanda (el usuario pulsa un botón), así que si Groq falla
// el frontend debe poder mostrar un error y ofrecer reintentar, en vez de
// fallar en silencio.
export async function generarTutorFallo(datos) {
  const userPrompt = construirPromptUsuario(datos);
  const texto = await generarConGroq({ systemPrompt: SYSTEM_PROMPT, userPrompt });
  return texto.trim();
}
