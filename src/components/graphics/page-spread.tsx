/**
 * Página dupla com mancha de texto, figura e fólios — a unidade de trabalho
 * da editora, do mesmo jeito que a camada é a da impressão 3D.
 */
export function PageSpread() {
  const lines = Array.from({ length: 11 }, (_, index) => index);

  return (
    <svg
      viewBox="0 0 400 300"
      aria-hidden
      focusable="false"
      className="h-full w-full"
    >
      <g opacity={0.9}>
        <rect
          x={30}
          y={30}
          width={165}
          height={240}
          rx={2}
          fill="currentColor"
          opacity={0.05}
        />
        <rect
          x={205}
          y={30}
          width={165}
          height={240}
          rx={2}
          fill="currentColor"
          opacity={0.05}
        />
      </g>

      {/* Mancha de texto da página esquerda. */}
      <g fill="currentColor" opacity={0.35}>
        {lines.map((index) => (
          <rect
            key={`l${index}`}
            x={50}
            y={70 + index * 16}
            width={index === 10 ? 78 : 125}
            height={4}
            rx={2}
          />
        ))}
      </g>

      {/* Figura e legenda da página direita. */}
      <rect
        x={225}
        y={70}
        width={125}
        height={78}
        rx={2}
        fill="var(--primary)"
        opacity={0.16}
        stroke="var(--primary)"
        strokeWidth={1.5}
      />
      <text
        x={225}
        y={165}
        className="font-mono"
        fontSize={11}
        fill="currentColor"
        opacity={0.6}
      >
        FIG. 1
      </text>
      <g fill="currentColor" opacity={0.35}>
        {lines.slice(0, 6).map((index) => (
          <rect
            key={`r${index}`}
            x={225}
            y={182 + index * 16}
            width={index === 5 ? 60 : 125}
            height={4}
            rx={2}
          />
        ))}
      </g>

      {/* Fólios. */}
      <text
        x={50}
        y={262}
        className="font-serif"
        fontSize={12}
        fill="currentColor"
        opacity={0.55}
      >
        14
      </text>
      <text
        x={350}
        y={262}
        className="font-serif"
        fontSize={12}
        fill="currentColor"
        opacity={0.55}
        textAnchor="end"
      >
        15
      </text>
    </svg>
  );
}
