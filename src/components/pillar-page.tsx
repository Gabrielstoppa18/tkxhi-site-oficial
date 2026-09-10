import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { CircuitField } from "@/components/circuit-field";
import { Reveal } from "@/components/motion/reveal";
import { PhotoPlate } from "@/components/photo-plate";
import { ContactActions } from "@/components/contact-actions";
import { pillars, type Pillar } from "@/lib/content";
import { photos } from "@/lib/photos";
import { cn } from "cn";

/**
 * As três páginas internas compartilham a mesma estrutura e mudam de material:
 * a Editora herda o registro em papel também aqui, não só na home.
 */
/** Foto de abertura de cada frente. Ver o aviso em src/lib/photos.ts. */
const HERO_PHOTO = {
  engenharia: photos.turtleBancada,
  "impressao-3d": photos.turtleCompleto,
  editora: photos.atividadeTrilha,
} as const;

export function PillarPage({
  pillar,
  extra,
}: {
  pillar: Pillar;
  /** Seções específicas da frente, entre os serviços e a chamada final. */
  extra?: ReactNode;
}) {
  const paper = pillar.register === "paper";
  const Icon = pillar.icon;
  const others = pillars.filter((item) => item.slug !== pillar.slug);

  return (
    <main
      className={cn(
        "flex flex-1 flex-col",
        pillar.colorClass,
        paper && "register-paper",
      )}
    >
      <section className="relative isolate overflow-hidden">
        {!paper && (
          <CircuitField
            animated={pillar.slug === "engenharia"}
            className="[mask-image:radial-gradient(ellipse_75%_75%_at_50%_0%,black,transparent)] text-foreground/[0.07]"
          />
        )}
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 pt-20 pb-16 sm:pt-24 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-7">
            <div className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase">
              <Icon aria-hidden className="size-4 text-primary" />
              {pillar.state}
            </div>
            <h1
              className={cn(
                "mt-6 text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-[-0.03em]",
                paper ? "font-serif" : "font-display uppercase",
              )}
            >
              {pillar.title}
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-pretty sm:text-2xl">
              {pillar.lead}
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
              {pillar.summary}
            </p>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-5">
            <PhotoPlate
              src={HERO_PHOTO[pillar.slug as keyof typeof HERO_PHOTO].src}
              alt={HERO_PHOTO[pillar.slug as keyof typeof HERO_PHOTO].alt}
              annotation={pillar.state + " · " + pillar.title}
              priority
            />
          </Reveal>
        </div>
      </section>

      <section className="border-t border-border/70">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <h2 className="font-mono text-[0.7rem] tracking-[0.22em] uppercase">
            O que fazemos
          </h2>
          <div className="mt-8 grid border-t border-border/70 md:grid-cols-3">
            {pillar.services.map((service, index) => (
              <Reveal
                key={service.title}
                delay={index * 0.08}
                className="border-b border-border/70 py-8 md:border-r md:border-b-0 md:pr-8 md:pl-8 md:first:pl-0 md:last:border-r-0"
              >
                <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3
                  className={cn(
                    "mt-4 text-xl font-bold tracking-tight",
                    paper ? "font-serif" : "font-display",
                  )}
                >
                  {service.title}
                </h3>
                <p className="mt-3 text-pretty text-muted-foreground">
                  {service.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {extra}

      <section className="border-t border-border/70">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <Reveal className="max-w-2xl">
            <h2
              className={cn(
                "text-3xl font-bold tracking-tight text-balance sm:text-4xl",
                paper ? "font-serif" : "font-display",
              )}
            >
              {pillar.cta}.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              Descreva o problema em duas linhas. Respondemos dizendo se é
              viável e por onde começaríamos.
            </p>
            <ContactActions className="mt-8" />
          </Reveal>

          <nav
            aria-label="Outras áreas"
            className="mt-16 grid gap-px border-t border-border/70 pt-8 sm:grid-cols-2"
          >
            {others.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className="group rounded-sm py-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase">
                  {item.state}
                </span>
                <span className="mt-2 flex items-center gap-2 text-xl font-medium">
                  {item.title}
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
