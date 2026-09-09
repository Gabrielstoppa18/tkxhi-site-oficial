import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * Moldura de mira técnica. Recebe uma foto quando existir; enquanto não
 * existir, mostra a ilustração do nicho — nunca uma caixa vazia.
 *
 * Trocar por foto real é trocar `photo`: o enquadramento, a legenda e o
 * comportamento responsivo não mudam.
 */
export function MediaFrame({
  eyebrow,
  caption,
  photo,
  children,
  className,
}: {
  eyebrow: string;
  caption: string;
  photo?: { src: string; alt: string };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("group", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card/30 transition-colors duration-300 group-hover:border-[var(--primary)]">
        {photo ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 p-6 text-foreground/70 transition-transform duration-500 group-hover:scale-[1.03]">
            {children}
          </div>
        )}

        {/* Marcas de canto: a mira de um desenho técnico. */}
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {[
            "top-3 left-3 border-t border-l",
            "top-3 right-3 border-t border-r",
            "bottom-3 left-3 border-b border-l",
            "bottom-3 right-3 border-b border-r",
          ].map((position) => (
            <span
              key={position}
              className={cn(
                "absolute size-4 border-primary opacity-60 transition-opacity duration-300 group-hover:opacity-100",
                position,
              )}
            />
          ))}
        </span>
      </div>

      <figcaption className="mt-4">
        <span className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
          {eyebrow}
        </span>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          {caption}
        </p>
      </figcaption>
    </figure>
  );
}
