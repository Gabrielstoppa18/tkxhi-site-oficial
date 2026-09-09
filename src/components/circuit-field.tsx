import { cn } from "cn";

/**
 * As trilhas de placa do logotipo, reaproveitadas como atmosfera.
 * Puramente decorativo: fica atrás do conteúdo, herda a cor do texto por
 * currentColor e nunca é anunciado por leitores de tela.
 */
const TRACES = [
  "M0 120 H140 L180 80 H320 L360 120 H520",
  "M1200 90 H1020 L980 130 H840 L800 90 H640",
  "M0 300 H90 L150 240 H260 L300 280 V420",
  "M1200 330 H1090 L1030 270 H900 L860 310 V440",
  "M120 700 V560 L180 500 H340 L380 460 H540",
  "M1080 700 V600 L1020 540 H880 L840 580 H700",
  "M400 700 V620 L460 560 H600",
  "M760 0 V80 L720 120 H600",
  "M480 0 V60 L520 100 H660 L700 60 V0",
  "M0 480 H160 L220 540 H360",
  "M1200 500 H1060 L1000 560 H860",
  "M900 160 H1000 L1040 200 V300",
];

const PADS = [
  [140, 120],
  [520, 120],
  [640, 90],
  [1020, 130],
  [300, 420],
  [860, 440],
  [540, 460],
  [700, 580],
  [600, 560],
  [600, 120],
  [360, 540],
  [860, 560],
  [1040, 300],
];

export function CircuitField({
  className,
  animated = false,
}: {
  className?: string;
  /** Acende pulsos correndo pelas trilhas. Use com parcimônia: um por página. */
  animated?: boolean;
}) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {TRACES.map((d) => (
          <path key={d} d={d} />
        ))}
        {PADS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={7} />
        ))}
      </g>

      {animated ? (
        <g
          className="trace-pulse"
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {TRACES.map((d, index) => (
            <path
              key={d}
              d={d}
              style={{ animationDelay: `${index * 0.85}s` }}
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}
