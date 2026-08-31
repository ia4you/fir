export default function DonutProgress({ porcentaje, size = 56, stroke = 6 }) {
  const radio = (size - stroke) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const relleno = Math.max(0, Math.min(100, porcentaje));
  const offset = circunferencia * (1 - relleno / 100);
  const centro = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={centro} cy={centro} r={radio} fill="none" stroke="var(--track)" strokeWidth={stroke} />
      <circle
        cx={centro}
        cy={centro}
        r={radio}
        fill="none"
        stroke="#0f766e"
        strokeWidth={stroke}
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
