"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Footer from "../../../components/Footer";

export default function PremiumSuccess() {
  const { update } = useSession();

  useEffect(() => {
    // el plan se guarda en el JWT en el login; tras pagar hay que releerlo
    // de la BD para que Perfil y los límites reflejen premium sin tener que
    // cerrar y volver a abrir sesión
    update();
  }, [update]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-10 pt-safe text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-3xl">
        🎉
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-ink">¡Ya eres usuario Premium! 🎉</h1>
      <p className="mt-2 text-ink-muted">
        Tu plan se ha activado correctamente. Ya puedes practicar sin límites.
      </p>

      <Link
        href="/inicio"
        className="mt-8 flex h-14 w-full max-w-xs items-center justify-center rounded-2xl bg-brand px-6 text-lg font-bold text-white shadow-sm active:bg-brand-dark"
      >
        Empezar a practicar
      </Link>

      <p className="mt-6 text-xs text-ink-muted">
        Recibirás un email de confirmación de Stripe.
      </p>
      <Footer />
    </div>
  );
}
