"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "mir_disclaimer_aceptado";

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        setVisible(true);
      }
    } catch {
      // localStorage no disponible (modo privado, etc.) — no mostramos el banner
    }
  }, []);

  // El banner es "fixed" y puede tapar botones al fondo de páginas cortas
  // (registro, login, la pregunta de un test...). Reservamos su altura real
  // como padding del body mientras esté visible, para que nunca cubra
  // contenido interactivo sin que haga falta ajustar cada página a mano.
  useEffect(() => {
    if (!visible || !ref.current) return;
    const alto = ref.current.offsetHeight;
    document.body.style.paddingBottom = `${alto}px`;
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  function aceptar() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // si no se puede persistir, al menos se cierra en esta sesión
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-track bg-card px-4 pb-safe pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <p className="flex-1 text-xs leading-snug text-ink-muted">
          FIR Turel usa preguntas oficiales del Ministerio de Sanidad (dominio público). Las
          explicaciones son generadas por IA y pueden contener errores — no sustituyen material
          oficial de preparación. Consulta nuestro aviso legal.
        </p>
        <div className="flex flex-shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={aceptar}
            className="flex h-9 items-center justify-center rounded-xl bg-brand px-4 text-xs font-bold text-white active:bg-brand-dark"
          >
            Entendido
          </button>
          <a
            href="/aviso-legal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center justify-center rounded-xl border-2 border-brand px-4 text-xs font-bold text-brand"
          >
            Aviso legal
          </a>
        </div>
      </div>
    </div>
  );
}
