import { notFound } from "next/navigation";

// Función desactivada temporalmente: todavía no hay preguntas PIR
// documentadas como controvertidas. Se reactivará cuando exista contenido
// real (ver app/lib/controversias.js).
export default function ControversiasPage() {
  notFound();
}
