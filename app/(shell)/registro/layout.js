import { getTotalPreguntas } from "../../lib/preguntas";

// generateMetadata consulta la BD (total de preguntas): sin esto, Next
// intentaría prerenderizar el metadata en build time y el build de Dokploy
// no tiene acceso a mir-db.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const totalPreguntas = await getTotalPreguntas();

  const description =
    totalPreguntas > 0
      ? `Regístrate gratis en FIR Turel y empieza a practicar con ${totalPreguntas.toLocaleString("es-ES")} preguntas oficiales del examen FIR.`
      : "Regístrate gratis en FIR Turel y empieza a practicar con preguntas oficiales del examen FIR de convocatorias anteriores.";

  return {
    title: "Crear cuenta gratis | FIR Turel",
    description,
    alternates: { canonical: "https://fir.turel.es/registro" },
  };
}

export default function RegistroLayout({ children }) {
  return children;
}
