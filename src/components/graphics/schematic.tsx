/**
 * Detalhe de placa: encapsulamento, pinos, trilhas e furos de passagem.
 * Ilustração técnica da frente de Engenharia, no lugar de uma foto genérica.
 */
export function Schematic() {
  const pins = [0, 1, 2, 3, 4, 5];

  return (
    <svg
      viewBox="0 0 400 300"
      aria-hidden
      focusable="false"
      className="h-full w-full"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.35}
        strokeLinecap="round"
      >
        <path d="M20 60 H90 L120 90 H180" />
        <path d="M20 150 H70 L100 120 H180" />
        <path d="M20 240 H110 L140 210 H180" />
        <path d="M380 70 H320 L290 100 H255" />
        <path d="M380 160 H300 L275 135 H255" />
        <path d="M380 250 H310 L280 220 H255" />
        {[
          [20, 60],
          [20, 150],
          [20, 240],
          [380, 70],
          [380, 160],
          [380, 250],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={5} />
        ))}
      </g>

      {/* Pinagem do encapsulamento. */}
      <g
        stroke="currentColor"
        strokeWidth={3}
        opacity={0.55}
        strokeLinecap="round"
      >
        {pins.map((index) => (
          <line
            key={`l${index}`}
            x1={172}
            x2={182}
            y1={78 + index * 30}
            y2={78 + index * 30}
          />
        ))}
        {pins.map((index) => (
          <line
            key={`r${index}`}
            x1={253}
            x2={263}
            y1={78 + index * 30}
            y2={78 + index * 30}
          />
        ))}
      </g>

      <rect
        x={182}
        y={62}
        width={71}
        height={186}
        rx={6}
        fill="var(--primary)"
        opacity={0.12}
        stroke="var(--primary)"
        strokeWidth={2}
      />
      {/* Marca do pino 1, como na serigrafia real. */}
      <circle cx={196} cy={78} r={5} fill="var(--primary)" opacity={0.8} />

      <text
        x={217}
        y={165}
        textAnchor="middle"
        className="font-mono"
        fontSize={13}
        fill="currentColor"
        opacity={0.6}
        transform="rotate(-90 217 165)"
      >
        TKX-01
      </text>
    </svg>
  );
}
