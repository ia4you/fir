"use client";
import { useEffect, useRef, useState } from "react";

function formatearFecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const POST_VACIO = {
  id: null,
  titulo: "",
  resumen: "",
  contenido: "",
  imagen_portada: null,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(null); // null | "borrador" | "publicar"
  const [error, setError] = useState("");
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [errorPortada, setErrorPortada] = useState("");
  const inputPortadaRef = useRef(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error();
      setPosts(await res.json());
    } catch {
      setError("No se ha podido cargar la lista de posts.");
    }
  }

  async function guardar(publicado) {
    if (!editando.titulo.trim() || !editando.contenido.trim()) {
      setError("Título y contenido son obligatorios.");
      return;
    }
    setGuardando(publicado ? "publicar" : "borrador");
    setError("");
    try {
      const esNuevo = !editando.id;
      const res = await fetch(esNuevo ? "/api/admin/blog" : `/api/admin/blog/${editando.id}`, {
        method: esNuevo ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editando, publicado }),
      });
      if (!res.ok) throw new Error();
      setEditando(null);
      cargar();
    } catch {
      setError("No se ha podido guardar el post.");
    } finally {
      setGuardando(null);
    }
  }

  async function borrar(id) {
    if (!confirm("¿Seguro que quieres borrar este post? No se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      cargar();
    } catch {
      setError("No se ha podido borrar el post.");
    }
  }

  async function subirPortada(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    setErrorPortada("");
    setSubiendoPortada(true);
    try {
      const formData = new FormData();
      formData.append("file", archivo);
      const res = await fetch("/api/admin/blog/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorPortada(data.error || "No se ha podido subir la imagen.");
        return;
      }
      setEditando({ ...editando, imagen_portada: data.url });
    } catch {
      setErrorPortada("No se ha podido subir la imagen. Comprueba tu conexión.");
    } finally {
      setSubiendoPortada(false);
    }
  }

  if (editando) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold mb-4">
          {editando.id ? "Editar post" : "Nuevo post"}
        </h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold mb-1">Título</label>
            <input
              className="w-full rounded border border-track bg-card px-3 py-2 text-ink focus:border-brand focus:outline-none"
              value={editando.titulo}
              onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
              placeholder="Título del post"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Resumen (opcional)</label>
            <input
              className="w-full rounded border border-track bg-card px-3 py-2 text-ink focus:border-brand focus:outline-none"
              value={editando.resumen || ""}
              onChange={(e) => setEditando({ ...editando, resumen: e.target.value })}
              placeholder="Resumen corto para el listado del blog"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Imagen de portada (opcional)</label>
            <p className="text-xs text-ink-muted mb-2">
              Se muestra en el listado y como cabecera del artículo.
            </p>
            {errorPortada && <p className="text-red-600 text-xs mb-1">{errorPortada}</p>}
            <div className="flex items-center gap-3">
              {editando.imagen_portada && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editando.imagen_portada}
                    alt="Portada"
                    className="h-20 w-32 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => setEditando({ ...editando, imagen_portada: null })}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border text-xs font-bold text-red-600 shadow-sm"
                    title="Quitar portada"
                  >
                    ×
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => inputPortadaRef.current?.click()}
                disabled={subiendoPortada}
                className="text-xs border px-2 py-1 rounded"
              >
                {subiendoPortada
                  ? "Subiendo..."
                  : editando.imagen_portada
                    ? "Cambiar portada"
                    : "Subir portada"}
              </button>
              <input
                ref={inputPortadaRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={subirPortada}
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Contenido</label>
            <textarea
              className="w-full rounded border border-track bg-card px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
              rows={18}
              value={editando.contenido}
              onChange={(e) => setEditando({ ...editando, contenido: e.target.value })}
              placeholder="Escribe el contenido del artículo"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => guardar(false)}
              disabled={!!guardando}
              className="border px-4 py-2 rounded font-bold"
            >
              {guardando === "borrador" ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              onClick={() => guardar(true)}
              disabled={!!guardando}
              className="bg-brand text-white font-bold px-4 py-2 rounded"
            >
              {guardando === "publicar" ? "Publicando…" : "Publicar"}
            </button>
            <button
              onClick={() => { setEditando(null); setError(""); }}
              className="border px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Blog ({posts?.length ?? "..."})</h2>
        <button
          onClick={() => setEditando({ ...POST_VACIO })}
          className="bg-brand text-white font-bold px-4 py-2 rounded"
        >
          + Nuevo post
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {!posts ? (
        <p>Cargando...</p>
      ) : posts.length === 0 ? (
        <p className="text-ink-muted">Todavía no hay posts.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{p.titulo}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      p.publicado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.publicado ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  /blog/{p.slug} · {p.publicado ? "publicado" : "actualizado"}{" "}
                  {formatearFecha(p.publicado_at || p.updated_at)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/admin/blog/${p.id}`);
                    setEditando(await res.json());
                  }}
                  className="text-sm border px-3 py-1.5 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => borrar(p.id)}
                  className="text-sm border border-red-300 text-red-600 px-3 py-1.5 rounded"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
