export default function ToggleSwitch({ activo, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
        activo ? "bg-brand" : "bg-track"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          activo ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
