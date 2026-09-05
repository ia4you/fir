"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Footer from "../../components/Footer";

const FILAS_COMPARATIVA = [
  { caracteristica: "Preguntas por día", free: "10", premium: "∞" },
  { caracteristica: "Historial y estadísticas", free: true, premium: true },
  { caracteristica: "Repaso de fallos", free: true, premium: true },
  { caracteristica: "Simulacro completo", free: false, premium: true },
  { caracteristica: "Sin límite diario", free: false, premium: true },
];

function Celda({ valor }) {
  if (valor === true) {
    return <span className="text-success">✓</span>;
  }
  if (valor === false) {
    return <span className="text-danger">✗</span>;
  }
  return <span>{valor}</span>;
}

export default function Premium() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const esPremium = session?.user?.plan === "premium";

  async function suscribirse() {
    setError("");
    if (status !== "authenticated") {
      router.push("/login?callbackUrl=/premium");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se ha podido iniciar el pago");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message || "No se ha podido iniciar el pago. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pb-10 pt-safe text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-3xl">
        ⭐
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-ink">Plan Premium — FIR Turel</h1>
      <p className="mt-2 text-ink-muted">Prepara el FIR sin límites</p>

      <div className="mt-6 w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-track bg-panel">
              <th className="px-3 py-2.5 font-bold text-ink">Característica</th>
              <th className="px-3 py-2.5 text-center font-bold text-ink-muted">Free</th>
              <th className="px-3 py-2.5 text-center font-bold text-brand">Premium</th>
            </tr>
          </thead>
          <tbody>
            {FILAS_COMPARATIVA.map((fila) => (
              <tr key={fila.caracteristica} className="border-b border-track last:border-0">
                <td className="px-3 py-2.5 text-ink">{fila.caracteristica}</td>
                <td className="px-3 py-2.5 text-center text-ink-muted">
                  <Celda valor={fila.free} />
                </td>
                <td className="px-3 py-2.5 text-center font-semibold text-ink">
                  <Celda valor={fila.premium} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 w-full max-w-sm rounded-2xl bg-brand-light p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">Precio</p>
        <p className="mt-1 text-2xl font-extrabold text-ink">9,99€/mes</p>
        <p className="mt-1 text-sm text-ink-muted">Cancela cuando quieras</p>
      </div>

      {esPremium ? (
        <div className="mt-6 w-full max-w-sm rounded-2xl bg-success-bg p-4 text-sm font-semibold text-success-text">
          Ya eres usuario premium — gracias por tu apoyo ❤️
        </div>
      ) : (
        <>
          {error && (
            <p className="mt-6 text-sm font-semibold text-danger-text">{error}</p>
          )}
          <button
            type="button"
            onClick={suscribirse}
            disabled={enviando}
            className="mt-6 flex h-14 w-full max-w-sm items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-sm active:bg-brand-dark disabled:opacity-60"
          >
            {enviando ? "Redirigiendo…" : "Suscribirme por 9,99€/mes"}
          </button>
        </>
      )}

      <Link
        href="/inicio"
        className="mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-2xl border border-track font-bold text-ink"
      >
        Volver al inicio
      </Link>
      <Footer />
    </div>
  );
}
