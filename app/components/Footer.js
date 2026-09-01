import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-track px-5 py-10 text-sm text-ink-muted">
      <nav className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-6 gap-y-2 text-center font-semibold text-brand">
        <Link href="/#hero">Inicio</Link>
        <Link href="/login">Login</Link>
        <Link href="/registro">Registro</Link>
        <Link href="/aviso-legal">Aviso legal</Link>
        <Link href="/privacidad">Privacidad</Link>
        <Link href="/contacto">Contacto</Link>
        <Link href="/blog">Blog</Link>
        <a href="/sitemap.xml">Sitemap</a>
      </nav>
      <div className="mx-auto mt-6 max-w-4xl text-center">
        <p>
          Fuentes: cuadernillos oficiales PIR 2021–2025,{" "}
          <a
            href="https://www.sanidad.gob.es"
            rel="noopener noreferrer"
            target="_blank"
            className="font-semibold text-brand"
          >
            Ministerio de Sanidad
          </a>
          .
        </p>
        <p className="mt-2">
          PIR Turel no está afiliado al Ministerio de Sanidad ni a ninguna academia de
          preparación PIR.
        </p>
      </div>
    </footer>
  );
}
