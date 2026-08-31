import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024; // 2MB (defensa en profundidad: el cliente ya comprime a ~15-30KB)
const DIRECTORIO_AVATARES = path.join(process.cwd(), "public", "avatares");

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { rows } = await query(`SELECT avatar_path FROM usuarios WHERE id = $1`, [
    session.user.id,
  ]);
  return NextResponse.json({ avatar_path: rows[0]?.avatar_path || null });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 400 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const archivo = formData.get("avatar");
  if (!archivo || typeof archivo === "string") {
    return NextResponse.json({ error: "No se ha recibido ninguna imagen." }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPEG, PNG o WEBP." },
      { status: 400 }
    );
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el tamaño máximo permitido (2MB)." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());

  await mkdir(DIRECTORIO_AVATARES, { recursive: true });
  // Nombre de archivo fijo por userId (nunca el nombre original que envía el
  // cliente): un usuario, un archivo, sin riesgo de path traversal.
  await writeFile(path.join(DIRECTORIO_AVATARES, `${userId}.jpg`), buffer);

  const avatarPath = `/api/avatares/${userId}`;
  await query(`UPDATE usuarios SET avatar_path = $1 WHERE id = $2`, [avatarPath, userId]);

  return NextResponse.json({ avatar_path: avatarPath });
}
