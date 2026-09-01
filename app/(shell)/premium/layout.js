import { getTotalPreguntas } from "../../lib/preguntas";

// generateMetadata consulta la BD (total de preguntas): sin esto, Next
// intentaría prerenderizar el metadata en build time y el build de Dokploy
// no tiene acceso a mir-db.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const totalPreguntas = await getTotalPreguntas();

  const description =
    totalPreguntas > 0
      ? `Accede a preguntas ilimitadas del examen PIR con el plan Premium de PIR Turel. Sin límite diario, acceso completo a las ${totalPreguntas.toLocaleString("es-ES")} preguntas oficiales.`
      : "Accede a preguntas ilimitadas del examen PIR con el plan Premium de PIR Turel. Sin límite diario, acceso completo a todas las preguntas oficiales.";

  return {
    title: "Plan Premium | PIR Turel",
    description,
    alternates: { canonical: "https://pir.turel.es/premium" },
  };
}

export default function PremiumLayout({ children }) {
  return children;
}
