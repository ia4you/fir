import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Lo llama <VisitaTracker /> desde el navegador, una vez al día por
// dispositivo (controlado con localStorage en el cliente). Sin secreto ni
// parámetros: el peor caso de abuso es inflar un contador de visitas, no
// hay datos sensibles de por medio.
export async function POST() {
  try {
    await query(`INSERT INTO visitas (fecha) VALUES (CURRENT_DATE) ON CONFLICT DO NOTHING`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No se ha podido registrar la visita" }, { status: 500 });
  }
}
