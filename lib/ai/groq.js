const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const TIMEOUT_MS = 15000;

export async function generarConGroq({ systemPrompt, userPrompt }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY no configurada");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.6,
        max_tokens: 900,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch (err) {
    throw new Error(
      err.name === "AbortError"
        ? "Timeout llamando a Groq"
        : `Error de red llamando a Groq: ${err.message}`
    );
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq respondió ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const texto =
    data?.choices?.[0]?.message?.content?.trim() ||
    data?.choices?.[0]?.message?.reasoning?.trim();
  if (!texto) {
    throw new Error("Groq no devolvió texto en la respuesta");
  }
  return texto;
}
