import { getTotalPreguntas } from "../../lib/preguntas";
import DemoClient from "./DemoClient";

// getTotalPreguntas consulta la BD: sin esto, Next intentaría
// prerenderizar esta página en build time y el build de Dokploy no tiene
// acceso a mir-db.
export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const totalPreguntas = await getTotalPreguntas();
  return <DemoClient totalPreguntas={totalPreguntas} />;
}
