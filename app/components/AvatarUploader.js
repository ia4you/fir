"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { comprimirImagen } from "../lib/comprimirImagen";

const TAMANO = 72;

export default function AvatarUploader() {
  const inputRef = useRef(null);
  const [avatarPath, setAvatarPath] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/perfil/avatar")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.avatar_path) setAvatarPath(data.avatar_path);
      })
      .catch(() => {});
  }, []);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError("");
    setSubiendo(true);
    try {
      const blob = await comprimirImagen(file);
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      const res = await fetch("/api/perfil/avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();

      // mismo nombre de archivo que antes: forzamos recarga con un query
      // param para que el navegador no sirva la versión cacheada
      setAvatarPath(`${data.avatar_path}?v=${Date.now()}`);
      setToast("Foto actualizada");
      setTimeout(() => setToast(""), 2500);
    } catch {
      setError("No se ha podido actualizar la foto. Inténtalo de nuevo.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: TAMANO, height: TAMANO }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Cambiar foto de perfil"
          disabled={subiendo}
          className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-brand bg-brand-light disabled:opacity-60"
        >
          {avatarPath ? (
            <Image
              src={avatarPath}
              alt="Foto de perfil"
              width={TAMANO}
              height={TAMANO}
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-9 w-9 text-brand"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.5-1.632Z"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Editar foto de perfil"
          disabled={subiendo}
          className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white shadow-sm ring-2 ring-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z"
            />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      {subiendo && <p className="mt-2 text-xs font-semibold text-ink-muted">Subiendo…</p>}
      {error && <p className="mt-2 max-w-[220px] text-center text-xs font-semibold text-danger-text">{error}</p>}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-5">
          <div className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-bold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
