import Logo from "../components/Logo";

export const metadata = {
  title: "Próximamente | PIR Turel",
  robots: { index: false, follow: false },
};

export default function ProximamentePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-5 text-center">
      <Logo className="h-14 w-auto" />
      <h1 className="text-2xl font-extrabold text-ink">Estamos preparando PIR Turel</h1>
      <p className="max-w-md text-ink-muted">
        Muy pronto podrás practicar el examen PIR con preguntas oficiales verificadas.
        Vuelve a pasarte en unos días.
      </p>
    </div>
  );
}
