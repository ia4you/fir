"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONOS = {
  inicio: (props) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.5V20h13V9.5" />
    </svg>
  ),
  practica: (props) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5c2-1 5-1 8 0v14c-3-1-6-1-8 0v-14Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 5.5c-2-1-5-1-8 0v14c3-1 6-1 8 0v-14Z" />
    </svg>
  ),
  estadisticas: (props) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  ),
  perfil: (props) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" d="M4.5 20c1.5-4 4-5.5 7.5-5.5s6 1.5 7.5 5.5" />
    </svg>
  ),
};

const TABS = [
  { href: "/inicio", label: "Inicio", icono: "inicio" },
  { href: "/configuracion", label: "Práctica", icono: "practica" },
  { href: "/estadisticas", label: "Estadísticas", icono: "estadisticas" },
  { href: "/perfil", label: "Perfil", icono: "perfil" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-track bg-card pb-safe">
      <div className="flex items-stretch justify-around px-2 pt-2">
        {TABS.map((tab) => {
          const activo = tab.href === "/inicio" ? pathname === "/inicio" : pathname.startsWith(tab.href);
          const Icono = ICONOS[tab.icono];
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex min-w-[64px] flex-col items-center gap-1 py-1"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  activo ? "bg-brand text-white" : "bg-transparent text-ink-muted"
                }`}
              >
                <Icono className="h-5 w-5" />
              </span>
              <span
                className={`text-xs font-semibold ${activo ? "text-brand" : "text-ink-muted"}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
