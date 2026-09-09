import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { pillars } from "@/lib/content";
import { cn } from "cn";

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
                pillar.register === "paper" && "register-paper",
              )}
            >
              {/* A cor da frente entra pela borda superior do painel. */}
              <article className="flex h-full flex-col border-t-2 border-primary p-8 lg:p-10">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
                    {pillar.state}
                  </span>
                  <Icon aria-hidden className="size-5 text-primary" />
                </div>

                <h3 className="mt-8 font-display text-2xl font-bold tracking-tight">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-lg text-pretty">{pillar.lead}</p>
                <p className="mt-4 text-sm text-pretty text-muted-foreground">
                  {pillar.summary}
                </p>

                <ul className="mt-8 space-y-4">
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
                  className="mt-8 inline-flex items-center gap-2 self-start rounded-sm text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
