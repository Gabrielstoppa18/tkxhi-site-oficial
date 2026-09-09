"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircuitField } from "@/components/circuit-field";
import { pillars } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

/**
 * O título é depositado camada por camada, de baixo para cima, com a linha
 * quente do bico passando junto — é assim que uma peça sai da impressora.
 * Cada verbo é uma frente da empresa e leva a cor dela, do mesmo jeito que o
 * logotipo escreve TkxHi com uma cor por letra.
 */
const LINE_DURATION = 0.5;
const LINE_GAP = 0.22;
const SWEEP_DURATION = pillars.length * LINE_GAP + LINE_DURATION;

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden">
      <CircuitField className="[mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)] text-foreground/[0.07]" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]"
      />

      <div className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[0.7rem] tracking-[0.22em] text-muted-foreground uppercase"
        >
          {siteConfig.name} — {siteConfig.tagline}
        </motion.p>

        <h1 className="relative mt-6 select-none">
          <span className="sr-only">
            Projetamos, imprimimos e publicamos. Engenharia, impressão 3D e
            editora técnica da {siteConfig.name}.
          </span>

          {pillars.map((pillar, index) => (
            <span key={pillar.slug} aria-hidden className="block">
              <motion.span
                initial={
                  reduce ? false : { clipPath: "inset(100% 0% 0% 0%)", y: 8 }
                }
                animate={{ clipPath: "inset(0% 0% 0% 0%)", y: 0 }}
                transition={{
                  duration: LINE_DURATION,
                  // A camada de baixo é depositada primeiro, como na máquina.
                  delay: (pillars.length - 1 - index) * LINE_GAP,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ "--stria": pillar.stria } as React.CSSProperties}
                className="extruded-type -my-[0.06em] block py-[0.06em] font-display text-[clamp(2.5rem,11.5vw,7.5rem)] leading-[0.9] font-extrabold tracking-[-0.035em] uppercase"
              >
                {pillar.verb}
              </motion.span>
            </span>
          ))}

          {!reduce && (
            <motion.span
              aria-hidden
              initial={{ top: "100%", opacity: 0 }}
              animate={{ top: "0%", opacity: [0, 1, 1, 0] }}
              transition={{
                duration: SWEEP_DURATION,
                ease: "linear",
                opacity: {
                  duration: SWEEP_DURATION,
                  times: [0, 0.08, 0.85, 1],
                },
              }}
              className="pointer-events-none absolute inset-x-0 h-px bg-primary shadow-[0_0_18px_4px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
            />
          )}
        </h1>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: reduce ? 0 : SWEEP_DURATION * 0.7,
          }}
        >
          <p className="mt-8 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
            Engenharia, manufatura aditiva e editora técnica sob o mesmo teto.
            Sua ideia sai daqui como projeto, como peça e como conhecimento
            registrado.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="#contato">
                Começar um projeto
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#frentes">Ver as três frentes</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Régua de estados: cada uma acesa na cor da sua frente. */}
      <div className="border-y border-border/70">
        <ol className="mx-auto flex w-full max-w-6xl divide-x divide-border px-6 font-mono text-[0.7rem] tracking-[0.18em] uppercase">
          {pillars.map((pillar) => (
            <li
              key={pillar.slug}
              className={`${pillar.colorClass} flex flex-1 items-center gap-2 py-4 pl-4 first:pl-0`}
            >
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">{pillar.state}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
