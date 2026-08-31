import Link from "next/link";
import {
  getEspecialidadesConConteo,
  getTotalPreguntasYEspecialidades,
} from "./lib/especialidades";
import Logo from "./components/Logo";
import ScrollToHash from "./components/ScrollToHash";
import Footer from "./components/Footer";

export async function generateMetadata() {
  const { totalPreguntas } = await getTotalPreguntasYEspecialidades();
  const hayDatos = totalPreguntas > 0;

  const description = hayDatos
    ? `Prepara el PIR con ${totalPreguntas.toLocaleString("es-ES")} preguntas oficiales verificadas de Sanidad. Practica por especialidades, simulacros y repasa tus fallos gratis.`
    : "Prepara el PIR con preguntas oficiales de convocatorias anteriores, verificadas de Sanidad. Practica por especialidades, simulacros y repasa tus fallos gratis.";

  const descriptionOg = hayDatos
    ? `${totalPreguntas.toLocaleString("es-ES")} preguntas reales verificadas. Gratis.`
    : "Preguntas reales verificadas. Gratis.";

  return {
    title: "Prepara el PIR con preguntas oficiales | PIR Turel",
    description,
    alternates: { canonical: "https://pir.turel.es" },
    openGraph: {
      title: "PIR Turel — Banco de preguntas oficiales PIR",
      description: descriptionOg,
      url: "https://pir.turel.es",
      siteName: "PIR Turel",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

// El build de Dokploy corre sin acceso a mir-db (red de build aislada de la
// red de runtime), así que las páginas que consultan la BD no pueden
// prerenderizarse en build time — se fuerza SSR por request.
export const dynamic = "force-dynamic";

const PASOS = [
  {
    titulo: "Elige especialidad o año",
    texto: "Practica por bloque temático o repasa una convocatoria completa.",
    icono: (props) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5c2-1 5-1 8 0v14c-3-1-6-1-8 0v-14Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 5.5c-2-1-5-1-8 0v14c3-1 6-1 8 0v-14Z" />
      </svg>
    ),
  },
  {
    titulo: "Responde las preguntas",
    texto: "Corrige tus respuestas al instante y consulta la explicación clínica cuando esté disponible.",
    icono: (props) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4 10-10" />
      </svg>
    ),
  },
  {
    titulo: "Ve tu progreso por especialidad",
    texto: "Detecta tus puntos débiles y enfoca el repaso donde más falta hace.",
    icono: (props) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),
  },
];

const BENEFICIOS = [
  {
    texto: "Repasa por especialidad y detecta tus puntos débiles antes del examen.",
    icono: (props) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    texto: "Preguntas iguales a las del examen real, verificadas con las plantillas oficiales.",
    icono: (props) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 4 6.5v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-5L12 3.5Z" />
      </svg>
    ),
  },
  {
    texto: "Practica unos minutos cada día desde el móvil y gana constancia.",
    icono: (props) => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path strokeLinecap="round" d="M11 18h2" />
      </svg>
    ),
  },
];

export default async function LandingPage() {
  const [especialidades, { totalPreguntas, totalEspecialidades }] = await Promise.all([
    getEspecialidadesConConteo(),
    getTotalPreguntasYEspecialidades(),
  ]);
  const hayDatos = totalPreguntas > 0;

  const schemaOrganizacion = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "PIR Turel",
    url: "https://pir.turel.es",
    description: hayDatos
      ? `Plataforma de preparación del examen PIR con ${totalPreguntas.toLocaleString("es-ES")} preguntas oficiales de convocatorias anteriores del Ministerio de Sanidad.`
      : "Plataforma de preparación del examen PIR con preguntas oficiales de convocatorias anteriores del Ministerio de Sanidad.",
    educationalCredentialAwarded: "Psicólogo Interno Residente (PIR)",
    provider: {
      "@type": "Organization",
      name: "PIR Turel",
      url: "https://pir.turel.es",
    },
  };

  const textoHero = hayDatos
    ? `${totalPreguntas.toLocaleString("es-ES")} preguntas reales · ${totalEspecialidades} especialidades · Respuestas oficiales de las plantillas del Ministerio de Sanidad`
    : "Preguntas oficiales reales de convocatorias anteriores · Respuestas oficiales de las plantillas del Ministerio de Sanidad";

  return (
    <div className="min-h-screen bg-surface">
      <ScrollToHash />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganizacion) }}
      />
      <header className="flex items-center justify-between gap-3 border-b border-track bg-card px-5 py-3 pt-safe">
        <Link href="/" aria-label="Ir al inicio" className="flex-shrink-0">
          <Logo className="h-11 w-auto sm:h-12 md:h-14 lg:h-16" />
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="whitespace-nowrap rounded-lg px-2 py-1 text-xs font-bold text-brand sm:hidden"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="hidden whitespace-nowrap text-sm font-bold text-ink sm:inline"
          >
            Login
          </Link>
          <Link
            href="/registro"
            className="hidden whitespace-nowrap rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm active:bg-brand-dark sm:inline-block"
          >
            Registro
          </Link>
        </nav>
      </header>

      <section id="hero" className="px-5 pt-10 pb-12 text-center sm:pt-14 sm:pb-16">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
          Te hacemos mejor respondiendo preguntas PIR
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-muted sm:text-lg">
          Preguntas PIR oficiales. Respuestas verificadas. Controversias documentadas.
        </p>

        <div className="mx-auto mt-7 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/demo"
            className="flex h-14 items-center justify-center rounded-2xl bg-brand px-8 text-lg font-bold text-white shadow-sm active:bg-brand-dark"
          >
            Empezar gratis
          </Link>
          <a
            href="#como-funciona"
            className="flex h-14 items-center justify-center rounded-2xl border-2 border-brand px-8 text-lg font-bold text-brand"
          >
            Ver cómo funciona
          </a>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-sm font-semibold text-ink-muted">
          {textoHero}
        </p>
      </section>

      <section id="como-funciona" className="px-5 py-12 sm:py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink">Cómo funciona</h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-3">
          {PASOS.map((paso, i) => (
            <div key={paso.titulo} className="rounded-2xl bg-card p-5 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <paso.icono className="h-6 w-6" />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand">
                Paso {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-bold text-ink">{paso.titulo}</h3>
              <p className="mt-1 text-sm text-ink-muted">{paso.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="especialidades" className="px-5 py-12 sm:py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink">Especialidades</h2>
        <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {especialidades.map((e) => (
            <Link
              key={e.slug}
              href={`/especialidades/${e.slug}`}
              className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-sm active:bg-brand-light"
            >
              <span className="font-bold text-ink">{e.nombre}</span>
              <span className="mt-1 text-sm text-ink-muted">{e.total} preguntas</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="beneficios" className="px-5 py-12 sm:py-16">
        <h2 className="text-center text-2xl font-extrabold text-ink">
          Por qué estudiar con PIR Turel
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.texto} className="rounded-2xl bg-card p-5 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <b.icono className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-ink">{b.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-14 text-center sm:py-16">
        <h2 className="text-2xl font-extrabold text-ink">Empieza hoy</h2>
        <p className="mt-2 text-ink-muted">Empieza gratis — sin tarjeta de crédito</p>
        <Link
          href="/registro"
          className="mx-auto mt-6 flex h-14 max-w-xs items-center justify-center rounded-2xl bg-brand px-8 text-lg font-bold text-white shadow-sm active:bg-brand-dark"
        >
          Crear cuenta gratis
        </Link>
      </section>

      <section className="px-5 py-10 text-center">
        <div className="mx-auto max-w-md rounded-2xl bg-panel p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            También te puede interesar
          </p>
          <p className="mt-2 text-sm font-bold text-ink">
            ¿Preparas el MIR de Medicina o el EIR de Enfermería, no el PIR de Psicología?
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Tenemos proyectos hermanos con el mismo enfoque: preguntas oficiales
            verificadas para los exámenes MIR y EIR.
          </p>
          <div className="mt-3 flex justify-center gap-4">
            <a
              href="https://mir.turel.es"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-bold text-brand"
            >
              Visitar mir.turel.es →
            </a>
            <a
              href="https://eir.turel.es"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-bold text-brand"
            >
              Visitar eir.turel.es →
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
