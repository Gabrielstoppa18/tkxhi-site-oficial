import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { pillars } from "@/lib/content";
import { cn } from "cn";

/**
 * Os três painéis partem do mesmo fundo e se separam pelo material: malha de
 * papel milimetrado na Engenharia, estrias de deposição na Impressão 3D,
 * retícula de meio-tom na Editora. Cada textura é a superfície em que aquele
 * ofício trabalha — e cada uma pinta na cor da própria frente.
 */
export function Pillars() {
  return (
    <section id="frentes" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-6 pt-20 pb-12 sm:pt-28">
        <Reveal>
          <SectionHeading
            eyebrow="Três estados da mesma ideia"
            title="Uma ideia não termina no desenho."
            lead="A TkxHi acompanha o percurso inteiro: o que é projetado é fabricado, e o que é aprendido no caminho é publicado."
          />
        </Reveal>
      </div>

      <div className="grid border-y border-border/70 md:grid-cols-3">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;
          return (
            <Reveal
              key={pillar.slug}
              delay={index * 0.08}
              className={cn(
                "border-b border-border/70 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0",
                pillar.colorClass,
              )}
            >
              <article
                className={cn(
                  "group relative flex h-full flex-col border-t-2 border-primary p-8 transition-colors duration-300 lg:p-10",
                  pillar.material,
                )}
              >
                {/* A textura recua do centro para o texto respirar. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,var(--background)_35%,transparent)]"
                />

                <div className="relative flex items-center justify-between gap-4">
                  <span className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
                    {pillar.state}
                  </span>
                  <Icon
                    aria-hidden
                    className="size-5 text-primary transition-transform duration-300 group-hover:-translate-y-0.5"
                  />
                </div>

                <h3 className="relative mt-8 font-display text-2xl font-bold tracking-tight">
                  {pillar.title}
                </h3>
                <p className="relative mt-3 text-lg text-pretty">
                  {pillar.lead}
                </p>
                <p className="relative mt-4 text-sm text-pretty text-muted-foreground">
                  {pillar.summary}
                </p>

                <ul className="relative mt-8 space-y-4">
                  {pillar.services.map((service) => (
                    <li key={service.title}>
                      <h4 className="text-sm font-semibold">{service.title}</h4>
                      <p className="mt-1 text-sm text-pretty text-muted-foreground">
                        {service.description}
                      </p>
                    </li>
                  ))}
                </ul>

                <Link
                  href={pillar.href}
                  className="relative mt-8 inline-flex items-center gap-2 self-start rounded-sm text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {pillar.cta}
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
