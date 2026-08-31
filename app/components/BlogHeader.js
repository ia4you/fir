import Link from "next/link";
import Logo from "./Logo";

// Cabecera mínima compartida por /blog y /blog/[slug], consistente con la
// landing (mismo header bar) pero sin la navegación de login/registro.
export default function BlogHeader() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-track bg-card px-5 py-3 pt-safe">
      <Link href="/" aria-label="Ir al inicio" className="flex-shrink-0">
        <Logo className="h-11 w-auto sm:h-12" />
      </Link>
      <Link
        href="/demo"
        className="whitespace-nowrap rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm active:bg-brand-dark"
      >
        Empezar gratis
      </Link>
    </header>
  );
}
