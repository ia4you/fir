"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import BottomNav from "../../components/BottomNav";
import ToggleSwitch from "../../components/ToggleSwitch";
import FieldCard from "../../components/FieldCard";
import Chip from "../../components/Chip";
import { getTemporizadorDefecto } from "../../lib/preferencias";

const ANIOS = ["2021", "2022", "2023", "2024", "2025"];
const LIMITE_DIARIO_FREE = 10;
// Examen real: 4 horas para todo el simulacro (no por pregunta).
const SEGUNDOS_SIMULACRO = 4 * 60 * 60;
const OPCIONES_CANTIDAD = [
  { valor: "5", etiqueta: "5", numero: 5 },
  { valor: "10", etiqueta: "10", numero: 10 },
  { valor: "20", etiqueta: "20", numero: 20 },
  { valor: "50", etiqueta: "50", numero: 50 },
  { valor: "simulacro", etiqueta: "Simulacro completo", numero: 206 },
];
const OPCIONES_SEGUNDOS = [30, 45, 60, 90];

function SelectNativo({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="h-12 w-full appearance-none rounded-xl border border-track bg-card px-4 pr-10 font-semibold text-ink focus:border-brand focus:outline-none"
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}


export default function Configuracion() {
  const router = useRouter();
  const { data: session } = useSession();

  const esPremium = session?.user?.plan === "premium";

  const [modoTest, setModoTest] = useState("practica"); // "practica" | "simulacro"
  const [tema, setTema] = useState("");
  const [anio, setAnio] = useState("");
  const [cantidad, setCantidad] = useState("20");
  const [temporizadorActivo, setTemporizadorActivo] = useState(
    () => getTemporizadorDefecto().activo
  );
  const [segundos, setSegundos] = useState(() => getTemporizadorDefecto().segundos);
  const [restanteHoy, setRestanteHoy] = useState(null); // null = aún no se sabe

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    if (session.user.plan === "premium") {
      setRestanteHoy(Infinity);
      return;
    }
    fetch("/api/estadisticas")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((datos) => {
        setRestanteHoy(Math.max(0, LIMITE_DIARIO_FREE - datos.meta_diaria.respondidas_hoy));
      })
      .catch(() => setRestanteHoy(LIMITE_DIARIO_FREE));
  }, [session]);

  // si la opción seleccionada deja de caber en lo que queda del día, bajamos
  // automáticamente a la mayor que sí quepa
  useEffect(() => {
    if (restanteHoy === null) return;
    const actual = OPCIONES_CANTIDAD.find((o) => o.valor === cantidad);
    if (actual && actual.numero > restanteHoy) {
      const alternativa = [...OPCIONES_CANTIDAD].reverse().find((o) => o.numero <= restanteHoy);
      setCantidad(alternativa ? alternativa.valor : OPCIONES_CANTIDAD[0].valor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restanteHoy]);

  async function empezarSimulacro() {
    if (!esPremium) {
      setError("El simulacro PIR completo es una función premium.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const params = new URLSearchParams({ modo: "simulacro" });
      const resPreguntas = await fetch(`/api/preguntas?${params.toString()}`);
      if (!resPreguntas.ok) throw new Error("No se pudieron cargar las preguntas");
      const preguntas = await resPreguntas.json();

      if (preguntas.length === 0) {
        setError("No hay preguntas disponibles para el simulacro.");
        setEnviando(false);
        return;
      }

      const resSesion = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "simulacro",
          tema: null,
          total_preguntas: preguntas.length,
        }),
      });

      if (resSesion.status === 403) {
        const data = await resSesion.json().catch(() => null);
        if (data?.error === "limite_diario") {
          setLimiteAlcanzado(true);
          setEnviando(false);
          return;
        }
      }
      if (!resSesion.ok) throw new Error("No se pudo crear la sesión");
      const { id } = await resSesion.json();

      sessionStorage.setItem(
        `mir_test_${id}`,
        JSON.stringify({
          preguntas,
          segundosPorPregunta: null,
          modoExamen: "simulacro",
          segundosTotales: SEGUNDOS_SIMULACRO,
        })
      );

      router.push(`/test/${id}`);
    } catch (e) {
      setError("Ha ocurrido un error al preparar el simulacro. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  async function empezarTest() {
    if (modoTest === "simulacro") {
      await empezarSimulacro();
      return;
    }

    setError("");
    setEnviando(true);
    try {
      const params = new URLSearchParams();
      if (tema) params.set("tema", tema);
      if (anio) params.set("anio", anio);
      const opcionCantidad = OPCIONES_CANTIDAD.find((o) => o.valor === cantidad);
      params.set("cantidad", opcionCantidad ? String(opcionCantidad.numero) : cantidad);

      const resPreguntas = await fetch(`/api/preguntas?${params.toString()}`);
      if (!resPreguntas.ok) throw new Error("No se pudieron cargar las preguntas");
      const preguntas = await resPreguntas.json();

      if (preguntas.length === 0) {
        setError("No hay preguntas disponibles con estos filtros. Prueba con otra combinación.");
        setEnviando(false);
        return;
      }

      const resSesion = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "practica",
          tema: tema || null,
          total_preguntas: preguntas.length,
        }),
      });

      if (resSesion.status === 403) {
        const data = await resSesion.json().catch(() => null);
        if (data?.error === "limite_diario") {
          setLimiteAlcanzado(true);
          setEnviando(false);
          return;
        }
      }
      if (!resSesion.ok) throw new Error("No se pudo crear la sesión");
      const { id } = await resSesion.json();

      sessionStorage.setItem(
        `mir_test_${id}`,
        JSON.stringify({
          preguntas,
          segundosPorPregunta: temporizadorActivo ? segundos : null,
          modoExamen: "practica",
        })
      );

      router.push(`/test/${id}`);
    } catch (e) {
      setError("Ha ocurrido un error al preparar el test. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="flex items-center gap-3 px-5 pt-safe">
        <Link
          href="/inicio"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm"
          aria-label="Volver al inicio"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-ink">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 5-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold text-ink">Configurar test</h1>
      </header>

      <div className="mt-5 flex flex-col gap-4 px-5">
        <FieldCard label="Modo de test">
          <div className="flex gap-2">
            <Chip activo={modoTest === "practica"} onClick={() => setModoTest("practica")}>
              Práctica
            </Chip>
            <Chip
              activo={modoTest === "simulacro"}
              disabled={!esPremium}
              onClick={() => setModoTest("simulacro")}
              title={!esPremium ? "Función premium — hazte premium para desbloquearla" : undefined}
            >
              {!esPremium && "🔒 "}Simulacro PIR
            </Chip>
          </div>
          {!esPremium && (
            <p className="mt-3 text-xs text-ink-muted">
              El simulacro PIR completo (examen real cronometrado) es una función premium.{" "}
              <Link href="/premium" className="font-bold text-brand">
                Hazte premium
              </Link>{" "}
              para desbloquearlo.
            </p>
          )}
        </FieldCard>

        {modoTest === "practica" && (
          <>
            <FieldCard label="Tema">
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Todos los temas — escribe para filtrar"
                className="h-12 w-full rounded-xl border border-track bg-card px-4 font-semibold text-ink placeholder:font-normal placeholder:text-ink-muted focus:border-brand focus:outline-none"
              />
            </FieldCard>

            <FieldCard label="Año">
              <SelectNativo value={anio} onChange={(e) => setAnio(e.target.value)}>
                <option value="">Todos los años</option>
                {ANIOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </SelectNativo>
            </FieldCard>

            <FieldCard label="Número de preguntas">
              <div className="flex gap-2">
                {OPCIONES_CANTIDAD.map((o) => {
                  const superaLimite = restanteHoy !== null && o.numero > restanteHoy;
                  return (
                    <Chip
                      key={o.valor}
                      activo={cantidad === o.valor}
                      disabled={superaLimite}
                      onClick={() => setCantidad(o.valor)}
                      title={
                        superaLimite && restanteHoy > 0
                          ? `Límite diario: te quedan ${restanteHoy} preguntas hoy`
                          : undefined
                      }
                    >
                      {superaLimite && "🔒 "}
                      {o.etiqueta}
                    </Chip>
                  );
                })}
              </div>
              {restanteHoy !== null && restanteHoy < Infinity && (
                <>
                  {restanteHoy > 0 ? (
                    <p className="mt-3 text-xs text-ink-muted">
                      Con tu plan gratuito puedes responder {restanteHoy} preguntas más hoy.{" "}
                      <Link href="/premium" className="font-bold text-brand">
                        Hazte premium
                      </Link>{" "}
                      para acceso ilimitado.
                    </p>
                  ) : (
                    <p className="mt-3 rounded-xl bg-danger-bg p-3 text-xs font-semibold text-danger-text">
                      Has alcanzado tu límite diario. Vuelve mañana o{" "}
                      <Link href="/premium" className="font-bold underline">
                        hazte premium
                      </Link>
                      .
                    </p>
                  )}
                </>
              )}
            </FieldCard>

            <FieldCard label="Temporizador">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">
                  {temporizadorActivo
                    ? `Con temporizador — ${segundos} segundos por pregunta`
                    : "Sin temporizador"}
                </span>
                <ToggleSwitch activo={temporizadorActivo} onChange={setTemporizadorActivo} />
              </div>

              {temporizadorActivo && (
                <div className="mt-3 flex gap-2">
                  {OPCIONES_SEGUNDOS.map((s) => (
                    <Chip key={s} activo={segundos === s} onClick={() => setSegundos(s)}>
                      {s}s
                    </Chip>
                  ))}
                </div>
              )}
            </FieldCard>
          </>
        )}

        {modoTest === "simulacro" && (
          <FieldCard label="Cómo funciona el simulacro">
            <ul className="flex flex-col gap-2 text-sm text-ink">
              <li>
                📝 Examen de 206 preguntas, combinando los 5 años disponibles (2021-2025) y
                repartidas por tema según su peso histórico real en las convocatorias
                oficiales.
              </li>
              <li>⏱️ Temporizador real de 4 horas (240 minutos) para todo el examen.</li>
              <li>🚫 Sin corrección ni interrupciones durante el test — solo al terminar.</li>
              <li>🎯 Puntuación final con la fórmula oficial: aciertos − 1/3 de fallos.</li>
            </ul>
          </FieldCard>
        )}

        {error && (
          <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={empezarTest}
          disabled={
            enviando ||
            (modoTest === "practica" && restanteHoy === 0) ||
            (modoTest === "simulacro" && !esPremium)
          }
          className="h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark disabled:opacity-60"
        >
          {enviando
            ? "Preparando test…"
            : modoTest === "simulacro"
              ? "Empezar simulacro"
              : "Empezar test"}
        </button>
      </div>

      {limiteAlcanzado && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-card p-6 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-3xl">
              🌙
            </div>
            <p className="mt-3 text-lg font-extrabold text-ink">Has alcanzado tu límite diario</p>
            <p className="mt-2 text-sm text-ink-muted">
              Hoy ya has respondido 10 preguntas. Vuelve mañana para seguir practicando, o
              hazte premium para practicar sin límites.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/premium"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-brand font-bold text-white shadow-sm active:bg-brand-dark"
              >
                Hazte Premium por 9,99€/mes →
              </Link>
              <Link
                href="/inicio"
                className="flex h-12 w-full items-center justify-center rounded-xl border border-track font-bold text-ink"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
