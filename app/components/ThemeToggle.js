"use client";

import { useEffect, useState } from "react";
import Chip from "./Chip";
import { getTema, setTema, aplicarTema } from "../lib/preferencias";

const OPCIONES = [
  { valor: "sistema", etiqueta: "Sistema" },
  { valor: "claro", etiqueta: "Claro" },
  { valor: "oscuro", etiqueta: "Oscuro" },
];

export default function ThemeToggle() {
  const [tema, setTemaState] = useState("sistema");

  useEffect(() => {
    setTemaState(getTema());
  }, []);

  // Si la preferencia es "sistema", refleja en vivo un cambio de tema del
  // SO mientras la app está abierta (sin esto solo se aplicaría al recargar).
  useEffect(() => {
    if (tema !== "sistema") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => aplicarTema("sistema");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [tema]);

  function elegir(valor) {
    setTemaState(valor);
    setTema(valor);
  }

  return (
    <div className="flex gap-2">
      {OPCIONES.map((o) => (
        <Chip key={o.valor} activo={tema === o.valor} onClick={() => elegir(o.valor)}>
          {o.etiqueta}
        </Chip>
      ))}
    </div>
  );
}
