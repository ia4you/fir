// Genera un test personalizado ("puntos débiles") a partir de una lista de
// especialidades y/o temas: pide las preguntas, crea la sesión, guarda las
// preguntas en sessionStorage para /test/[id] y navega hasta allí. Extraído
// de PuntosDebiles.js para poder reutilizarlo también en el entrenamiento
// por tema.
//
// Devuelve { ok: true } tras navegar, o { limiteAlcanzado: true, message }
// si el usuario ha topado con su límite diario (403) — en ambos casos sin
// lanzar excepción. Cualquier otro fallo (red, respuesta no-ok, sin
// preguntas) se lanza como Error para que el llamador lo capture y muestre
// un mensaje genérico, igual que hacía el componente antes del refactor.
const TOTAL_PREGUNTAS_POR_DEFECTO = 20;

export async function entrenarConCriterios({
  especialidades = [],
  temas = [],
  cantidad = TOTAL_PREGUNTAS_POR_DEFECTO,
  router,
}) {
  const params = new URLSearchParams();
  if (especialidades.length > 0) params.set("especialidades", especialidades.join(","));
  if (temas.length > 0) params.set("temas", temas.join(","));
  params.set("cantidad", String(cantidad));

  const resPreguntas = await fetch(`/api/preguntas?${params.toString()}`);
  if (!resPreguntas.ok) throw new Error("preguntas");
  const preguntas = await resPreguntas.json();
  if (preguntas.length === 0) throw new Error("sin_preguntas");

  const resSesion = await fetch("/api/sesiones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modo: "puntos_debiles",
      especialidad: null,
      total_preguntas: preguntas.length,
    }),
  });

  if (resSesion.status === 403) {
    const data = await resSesion.json().catch(() => null);
    return {
      limiteAlcanzado: true,
      message: data?.message || "Has alcanzado tu límite diario de preguntas.",
    };
  }
  if (!resSesion.ok) throw new Error("sesion");
  const { id } = await resSesion.json();

  sessionStorage.setItem(
    `mir_test_${id}`,
    JSON.stringify({ preguntas, segundosPorPregunta: null })
  );
  router.push(`/test/${id}`);
  return { ok: true };
}
