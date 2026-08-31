import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { query } from "@/lib/db";
import { eliminarCuentaPorId } from "@/lib/eliminarCuenta";

export const dynamic = "force-dynamic";

// Tramita una solicitud de /eliminar-cuenta: busca la cuenta por el email
// solicitado y, si existe, la borra en cascada igual que el autoservicio.
// Si no existe (ya se borró antes, o el email no está registrado), no hay
// nada que borrar pero la solicitud igualmente se marca como procesada.
export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "id no válido" }, { status: 400 });
  }

  const { rows: solicitudRows } = await query(
    `SELECT email FROM solicitudes_eliminacion WHERE id = $1`,
    [id]
  );
  if (solicitudRows.length === 0) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }
  const email = solicitudRows[0].email;

  let cuentaEncontrada = false;
  try {
    const { rows: usuarioRows } = await query(`SELECT id FROM usuarios WHERE email = $1`, [
      email,
    ]);
    if (usuarioRows.length > 0) {
      cuentaEncontrada = true;
      await eliminarCuentaPorId(usuarioRows[0].id, email);
    }
  } catch (err) {
    console.error("Error tramitando solicitud de eliminación:", err);
    return NextResponse.json({ error: "No se ha podido eliminar la cuenta" }, { status: 500 });
  }

  const { rows } = await query(
    `UPDATE solicitudes_eliminacion SET procesada = TRUE WHERE id = $1 RETURNING id, procesada`,
    [id]
  );

  return NextResponse.json({ ...rows[0], cuenta_encontrada: cuentaEncontrada });
}
