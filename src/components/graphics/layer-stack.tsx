/**
 * Corte transversal de uma peça impressa: camadas de 0,2 mm empilhadas
 * formando um perfil curvo, com a cota de altura de camada.
 */
export function LayerStack() {
  const layers = 26;
  const rows = Array.from({ length: layers }, (_, index) => {
    const t = index / (layers - 1);
    // Perfil de ampulheta: estreita no meio, larga nas extremidades.
    const width = 60 + 150 * Math.abs(Math.cos(t * Math.PI));
    return { y: 262 - index * 8, width };
  });

  return (
    <svg
      viewBox="0 0 400 300"
      aria-hidden
      focusable="false"
      className="h-full w-full"
    >
      {rows.map((row, index) => (
        <rect
          key={row.y}
          x={200 - row.width / 2}
          y={row.y}
          width={row.width}
          height={6}
          rx={3}
          fill="var(--primary)"
          opacity={0.25 + (index / layers) * 0.55}
        />
      ))}

      {/* Cota da altura de camada. */}
      <g stroke="currentColor" strokeWidth={1.25} opacity={0.5}>
        <line x1={330} y1={262} x2={370} y2={262} />
        <line x1={330} y1={254} x2={370} y2={254} />
        <line x1={358} y1={262} x2={358} y2={254} />
      </g>
      <text
        x={366}
        y={248}
        className="font-mono"
        fontSize={12}
        fill="currentColor"
        opacity={0.65}
        textAnchor="end"
      >
        0,2 mm
      </text>

      <line
        x1={40}
        y1={268}
        x2={360}
        y2={268}
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.4}
      />
      <text
        x={40}
        y={288}
        className="font-mono"
        fontSize={12}
        fill="currentColor"
        opacity={0.55}
      >
        MESA
      </text>
    </svg>
  );
}
