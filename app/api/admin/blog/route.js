import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { rows } = await query(
    `SELECT id, titulo, slug, resumen, publicado, publicado_at, created_at, updated_at
     FROM blog_posts
     ORDER BY created_at DESC`
  );
  return NextResponse.json(rows);
}

export async function POST(req) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { titulo, resumen, contenido, publicado, imagen_portada } = await req.json();
  if (!titulo || !contenido) {
    return NextResponse.json({ error: "Título y contenido son obligatorios" }, { status: 400 });
  }
  let slug = slugify(titulo);
  const existe = await query("SELECT id FROM blog_posts WHERE slug = $1", [slug]);
  if (existe.rows.length > 0) {
    slug = `${slug}-${Date.now().toString().slice(-5)}`;
  }
  const publicadoBool = !!publicado;
  const { rows } = await query(
    `INSERT INTO blog_posts (titulo, slug, resumen, contenido, publicado, publicado_at, imagen_portada)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, titulo, slug, resumen, publicado, publicado_at, created_at, updated_at, imagen_portada`,
    [titulo, slug, resumen || null, contenido, publicadoBool, publicadoBool ? new Date() : null, imagen_portada || null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
