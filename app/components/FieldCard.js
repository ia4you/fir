export default function FieldCard({ label, children }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-muted">{label}</p>
      {children}
    </div>
  );
}
