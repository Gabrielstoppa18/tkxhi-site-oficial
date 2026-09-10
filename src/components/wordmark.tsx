import Image from "next/image";
import { cn } from "cn";

/**
 * Lockup horizontal oficial, exportado do Canva e recortado na caixa do
 * conteúdo (940 × 231). As letras têm desenho próprio — nenhuma fonte
 * reproduz isso — então aqui é imagem, não tipografia.
 *
 * Ajuste o tamanho pela altura (`h-*`); a proporção acompanha sozinha.
 */
export function Wordmark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative block aspect-[940/231] h-7", className)}>
      <Image
        src="/brand/tkxhi-wordmark.png"
        alt="TkxHi"
        fill
        priority={priority}
        sizes="240px"
        className="object-contain"
      />
    </span>
  );
}
