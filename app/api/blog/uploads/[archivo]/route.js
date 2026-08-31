import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// Servimos las imágenes subidas por esta ruta dinámica en vez de dejar que Next
// las resuelva como estático de /public: en producción (next start) el listado
// de /public queda fijado al arrancar el proceso, así que un archivo escrito en
// caliente por /api/admin/blog/upload nunca se sirve (404) hasta el próximo
// reinicio del contenedor. Leer el archivo a mano en cada petición evita ese caché.
const DIRECTORIO_UPLOADS = path.join(process.cwd(), "public", "blog", "uploads");
const TIPOS_MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
const NOMBRE_VALIDO = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/;

export async function GET(request, { params }) {
  const archivo = params.archivo;
  if (!NOMBRE_VALIDO.test(archivo)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(DIRECTORIO_UPLOADS, archivo));
    const extension = archivo.split(".").pop().toLowerCase();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": TIPOS_MIME[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
