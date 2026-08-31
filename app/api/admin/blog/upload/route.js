import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5MB
const DIRECTORIO_UPLOADS = path.join(process.cwd(), "public", "blog", "uploads");

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const archivo = formData.get("file");
  if (!archivo || typeof archivo === "string") {
    return NextResponse.json({ error: "No se ha recibido ninguna imagen." }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.has(archivo.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG o WEBP." },
      { status: 400 }
    );
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json(
      { error: "La imagen supera el tamaño máximo permitido (5MB)." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());

  await mkdir(DIRECTORIO_UPLOADS, { recursive: true });

  // Recomprime siempre a WebP (máx. 1600px de ancho), mismo criterio que
  // contactos.turel.es para las fotos del blog. Nombre generado (nunca el
  // original del cliente): evita colisiones y path traversal.
  const nombreArchivo = `${uuidv4()}.webp`;
  try {
    await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(DIRECTORIO_UPLOADS, nombreArchivo));
  } catch (err) {
    console.error("Error al procesar la imagen del blog:", err);
    return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 400 });
  }

  // Servida vía ruta dinámica, no como estático de /public (ver comentario en
  // app/api/blog/uploads/[archivo]/route.js: los estáticos escritos en caliente
  // no se sirven en producción hasta el próximo reinicio del contenedor).
  return NextResponse.json({ url: `/api/blog/uploads/${nombreArchivo}` });
}
