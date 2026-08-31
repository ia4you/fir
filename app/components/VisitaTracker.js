"use client";

import { useEffect } from "react";

export default function VisitaTracker() {
  useEffect(() => {
    const clave = `visitado_hoy_${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(clave)) return;

    fetch("/api/track-visit", { method: "POST" })
      .then(() => localStorage.setItem(clave, "1"))
      .catch(() => {});
  }, []);

  return null;
}
