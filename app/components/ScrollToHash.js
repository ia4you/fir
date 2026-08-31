"use client";

import { useEffect } from "react";

// next/link ya intenta hacer scroll al id del hash tras navegar, pero esta
// página carga datos async (getEspecialidadesConConteo) y el elemento puede
// no estar montado todavía cuando el router lo intenta — con lo cual el
// scroll nativo no llega a producirse. Se reintenta a mano unos instantes
// tras el montaje; si el navegador ya hizo scroll bien, esto no cambia nada
// visible (mismo destino, sin animación duplicada).
export default function ScrollToHash() {
  useEffect(() => {
    const id = window.location.hash?.slice(1);
    if (!id) return;

    let intentos = 0;
    const intervalo = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: "start" });
        clearInterval(intervalo);
      } else if (++intentos > 20) {
        clearInterval(intervalo);
      }
    }, 50);

    return () => clearInterval(intervalo);
  }, []);

  return null;
}
