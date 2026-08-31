import { getTotalPreguntasYEspecialidades } from "../../lib/especialidades";
import DemoClient from "./DemoClient";

// getTotalPreguntasYEspecialidades consulta la BD: sin esto, Next intentaría
// prerenderizar esta página en build time y el build de Dokploy no tiene
// acceso a mir-db.
export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const { totalPreguntas } = await getTotalPreguntasYEspecialidades();
  return <DemoClient totalPreguntas={totalPreguntas} />;
}
