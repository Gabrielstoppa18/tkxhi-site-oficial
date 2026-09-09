import Image from "next/image";
import { cn } from "cn";

/**
 * Chapa fotográfica: a foto deixa de ser um retângulo com cantos arredondados
 * e passa a ser um objeto do sistema visual.
 *
 * Três camadas fazem o trabalho. O canto chanfrado quebra o recorte padrão de
 * banco de imagens. O duotone tinge a foto na cor da frente — o que também
 * resolve a paleta estranha que toda foto de banco traz consigo. A retícula de
 * meio-tom por cima aproxima a imagem do impresso, e a chapa fantasma
 * deslocada atrás repete a ideia de registro fora de esquadro que aparece na
 * Editora.
 */
const NOTCH =
  "polygon(0 0, calc(100% - 2.75rem) 0, 100% 2.75rem, 100% 100%, 2.75rem 100%, 0 calc(100% - 2.75rem))";

export function PhotoPlate({
  src,
  alt,
  annotation,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  /** Anotação técnica no rodapé da chapa. */
  annotation?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={cn("relative", className)}>
      {/* Chapa fantasma: a passada de cor fora de registro. */}
      <span
        aria-hidden
        className="absolute inset-0 translate-x-3 translate-y-3 bg-primary/25"
        style={{ clipPath: NOTCH }}
      />

      <div
        className="relative isolate aspect-[4/5] overflow-hidden"
        style={{ clipPath: NOTCH }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover contrast-125 grayscale"
        />
        {/* Duotone na cor da frente. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-primary mix-blend-color"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-background/35 mix-blend-multiply"
        />
        {/* Trama de impressão. */}
        <span
          aria-hidden
          className="material-halftone absolute inset-0 opacity-40 mix-blend-overlay"
        />
        {/* Contorno interno, como a moldura de um clichê. */}
        <span
          aria-hidden
          className="absolute inset-0 border border-primary/40"
          style={{ clipPath: NOTCH }}
        />
      </div>

      {annotation ? (
        <figcaption className="mt-3 flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
          <span aria-hidden className="h-px w-8 bg-primary" />
          {annotation}
        </figcaption>
      ) : null}
    </figure>
  );
}
