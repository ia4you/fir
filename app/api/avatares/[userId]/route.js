import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

// Servida como ruta dinámica (no como archivo estático de /public) a
// propósito: el servidor de producción de Next.js (next start) construye la
// lista de archivos servibles de /public una sola vez al arrancar el
// proceso, así que un avatar subido después de ese arranque daría 404 hasta
// el siguiente reinicio/deploy. Una ruta de API siempre se ejecuta por
// petición, así que el archivo recién subido se sirve de inmediato.
export const dynamic = "force-dynamic";

const DIRECTORIO_AVATARES = path.join(process.cwd(), "public", "avatares");

export async function GET(request, { params }) {
  const userId = parseInt(params.userId, 10);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Usuario inválido." }, { status: 400 });
  }

  try {
    const buffer = await readFile(path.join(DIRECTORIO_AVATARES, `${userId}.jpg`));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "No hay foto de perfil." }, { status: 404 });
  }
}
