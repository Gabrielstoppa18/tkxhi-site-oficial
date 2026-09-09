import { cn } from "cn";

/**
 * O logotipo tem cinco letras em cinco cores. Enquanto o arquivo vetorial
 * oficial não entra em public/, o tipográfico reproduz a mesma sequência.
 */
const LETTERS = [
  { char: "T", color: "var(--mark-t)" },
  { char: "k", color: "var(--mark-k)" },
  { char: "x", color: "var(--mark-x)" },
  { char: "H", color: "var(--mark-h)" },
  { char: "i", color: "var(--mark-i)" },
];

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-xl font-extrabold tracking-[-0.02em]",
        className,
      )}
    >
      <span className="sr-only">TkxHi</span>
      {LETTERS.map((letter, index) => (
        <span key={index} aria-hidden style={{ color: letter.color }}>
          {letter.char}
        </span>
      ))}
    </span>
  );
}
