"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import FieldCard from "../../components/FieldCard";
import Logo from "../../components/Logo";
import PasswordInput from "../../components/PasswordInput";
import Footer from "../../components/Footer";

function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/inicio";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setEnviando(false);
    if (res?.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="flex flex-col gap-4 px-5">
      <FieldCard label="Email">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-xl border border-track bg-card px-4 font-medium text-ink focus:border-brand focus:outline-none"
          placeholder="tu@email.com"
        />
      </FieldCard>

      <FieldCard label="Contraseña">
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </FieldCard>

      {error && (
        <p className="rounded-2xl bg-danger-bg p-4 text-sm font-semibold text-danger-text">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-sm active:bg-brand-dark disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-sm text-ink-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-brand">
          Regístrate
        </Link>
      </p>
    </form>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen pb-10">
      <header className="px-5 pt-safe text-center">
        <Logo className="mx-auto h-16 w-auto" />
        <p className="mt-2 text-ink-muted">Inicia sesión para continuar</p>
      </header>

      <div className="mt-6">
        <Suspense fallback={null}>
          <FormularioLogin />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
