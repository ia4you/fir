import { getTotalPreguntas } from "../../lib/preguntas";

// generateMetadata consulta la BD (total de preguntas): sin esto, Next
// intentaría prerenderizar el metadata en build time y el build de Dokploy
// no tiene acceso a mir-db.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const totalPreguntas = await getTotalPreguntas();

  const description =
    totalPreguntas > 0
      ? `Regístrate gratis en PIR Turel y empieza a practicar con ${totalPreguntas.toLocaleString("es-ES")} preguntas oficiales del examen PIR.`
      : "Regístrate gratis en PIR Turel y empieza a practicar con preguntas oficiales del examen PIR de convocatorias anteriores.";

  return {
    title: "Crear cuenta gratis | PIR Turel",
    description,
    alternates: { canonical: "https://pir.turel.es/registro" },
  };
}

export default function RegistroLayout({ children }) {
  return children;
}
