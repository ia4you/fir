import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { getAdminSession } from "@/lib/adminAuth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const DIRECTORIO_UPLOADS = path.join(process.cwd(), "public", "blog", "uploads");
const NOMBRE_VALIDO = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/;

export async function GET(req, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { rows } = await query("SELECT * FROM blog_posts WHERE id = $1", [params.id]);
  if (rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { titulo, resumen, contenido, publicado, imagen_portada } = await req.json();
  const publicadoBool = !!publicado;

  const { rows: existentes } = await query(
    "SELECT publicado_at FROM blog_posts WHERE id = $1",
    [params.id]
  );
  if (existentes.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Publicar refresca publicado_at = now(); despublicar solo baja el flag,
  // sin borrar la fecha de la última publicación (conserva histórico).
  const publicadoAt = publicadoBool ? new Date() : existentes[0].publicado_at;

  const { rows } = await query(
    `UPDATE blog_posts
     SET titulo = $1, resumen = $2, contenido = $3, publicado = $4, publicado_at = $5, imagen_portada = $6, updated_at = now()
     WHERE id = $7
     RETURNING id, titulo, slug, resumen, publicado, publicado_at, created_at, updated_at, imagen_portada`,
    [titulo, resumen || null, contenido, publicadoBool, publicadoAt, imagen_portada || null, params.id]
  );
  return NextResponse.json(rows[0]);
}

export async function DELETE(req, { params }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { rows } = await query("SELECT imagen_portada FROM blog_posts WHERE id = $1", [params.id]);
  const post = rows[0];
  if (!post) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await query("DELETE FROM blog_posts WHERE id = $1", [params.id]);

  if (post.imagen_portada) {
    const nombreArchivo = post.imagen_portada.split("/").pop();
    if (NOMBRE_VALIDO.test(nombreArchivo)) {
      await unlink(path.join(DIRECTORIO_UPLOADS, nombreArchivo)).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
