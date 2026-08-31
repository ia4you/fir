export default function Chip({ activo, onClick, disabled = false, title, children }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      className={`h-11 flex-1 rounded-xl px-1 text-xs font-bold leading-tight transition-colors sm:text-sm ${
        disabled
          ? "cursor-not-allowed border border-track bg-track text-ink-muted opacity-60"
          : activo
            ? "bg-brand text-white"
            : "border border-track bg-card text-ink"
      }`}
    >
      {children}
    </button>
  );
}
