"use client";

import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "../lib/push";

const CLAVE_DESCARTADO = "mir_push_banner_descartado";

export default function PushBanner() {
  const [visible, setVisible] = useState(false);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (localStorage.getItem(CLAVE_DESCARTADO)) return;
    if (typeof Notification !== "undefined" && Notification.permission === "denied") return;

    navigator.serviceWorker.ready
      .then((registro) => registro.pushManager.getSubscription())
      .then((suscripcionExistente) => {
        if (!suscripcionExistente) setVisible(true);
      })
      .catch(() => {});
  }, []);

  function ahoraNo() {
    localStorage.setItem(CLAVE_DESCARTADO, "1");
    setVisible(false);
  }

  async function activar() {
    setActivando(true);
    setError("");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setVisible(false);
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "web", subscription: suscripcion.toJSON() }),
      });
      if (!res.ok) throw new Error();

      setVisible(false);
    } catch {
      setError("No se ha podido activar el recordatorio. Inténtalo de nuevo.");
    } finally {
      setActivando(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="mx-5 mt-4 rounded-2xl bg-brand-light p-4">
      <p className="text-sm font-semibold text-ink">¿Activar recordatorio diario?</p>
      <p className="mt-1 text-xs text-ink-muted">
        Te avisaremos si estás a punto de perder tu racha de días seguidos.
      </p>
      {error && <p className="mt-2 text-xs font-semibold text-danger-text">{error}</p>}
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={ahoraNo}
          disabled={activando}
          className="h-10 flex-1 rounded-xl border border-brand text-sm font-bold text-brand disabled:opacity-60"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={activar}
          disabled={activando}
          className="h-10 flex-1 rounded-xl bg-brand text-sm font-bold text-white disabled:opacity-60"
        >
          {activando ? "Activando…" : "Sí, activar"}
        </button>
      </div>
    </div>
  );
}
