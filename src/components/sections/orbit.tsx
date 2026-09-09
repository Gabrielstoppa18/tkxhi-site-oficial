"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { Schematic } from "@/components/graphics/schematic";
import { LayerStack } from "@/components/graphics/layer-stack";
import { PageSpread } from "@/components/graphics/page-spread";
import { pillars } from "@/lib/content";
import { stockPhotos } from "@/lib/photos";
import { cn } from "cn";

/**
 * As nove competências da casa em órbita: um anel por frente, cada serviço um
 * nó. Os anéis giram até alguém se aproximar — passar o mouse ou dar foco pelo
 * teclado congela tudo e abre o detalhe daquele serviço.
 *
 * Substitui a grade de seis quadros, em que foto e diagrama de frentes
 * diferentes se misturavam sem hierarquia. Aqui a órbita é o agrupamento.
 */
type Visual = { photo?: { src: string; alt: string }; graphic?: ReactNode };

/** Uma foto, um diagrama e outra foto por frente — nunca dois iguais seguidos. */
const VISUALS: Visual[][] = [
  [
    { photo: stockPhotos.engenhariaBancada },
    { graphic: <Schematic /> },
    { photo: stockPhotos.engenhariaTeste },
  ],
  [
    { photo: stockPhotos.impressaoMaquinas },
    { graphic: <LayerStack /> },
    { photo: stockPhotos.impressaoDetalhe },
  ],
  [
    { photo: stockPhotos.editoraPaginas },
    { graphic: <PageSpread /> },
    { photo: stockPhotos.editoraPagina },
  ],
];

const RADII = [22, 33, 44];
const DURATIONS = [38, 52, 68];
const AUTO_MS = 3800;

export function Orbit() {
  const reduce = useReducedMotion();

  const items = useMemo(
    () =>
      pillars.flatMap((pillar, p) =>
        pillar.services.map((service, s) => ({
          key: pillar.slug + "-" + s,
          pillar,
          service,
          visual: VISUALS[p][s],
        })),
      ),
    [],
  );

  const [hovered, setHovered] = useState<number | null>(null);
  const [auto, setAuto] = useState(0);

  useEffect(() => {
    if (reduce || hovered !== null) return;
    const id = setInterval(
      () => setAuto((value) => (value + 1) % items.length),
      AUTO_MS,
    );
    return () => clearInterval(id);
  }, [hovered, items.length, reduce]);

  const activeIndex = hovered ?? auto;
  const active = items[activeIndex];
  const paused = hovered !== null;
  const ActiveIcon = active.service.icon;

  return (
    <section className="border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Competências"
            title="Nove serviços, três órbitas."
            lead="Cada anel é uma frente da casa. Passe o mouse — ou navegue pelo teclado — para parar a órbita e abrir o serviço."
          />
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--mark-i)_18%,transparent),transparent_70%)]"
              />

              {RADII.map((radius, ring) => (
                <span
                  key={radius}
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute rounded-full border border-dashed",
                    pillars[ring].colorClass,
                  )}
                  style={{
                    inset: (50 - radius).toString() + "%",
                    borderColor:
                      "color-mix(in oklab, var(--primary) 30%, transparent)",
                  }}
                />
              ))}

              {pillars.map((pillar, ring) => (
                <div
                  key={pillar.slug}
                  className={cn(
                    "orbit-ring absolute inset-0",
                    pillar.colorClass,
                  )}
                  data-paused={paused}
                  style={
                    {
                      "--orbit-duration": DURATIONS[ring] + "s",
                    } as CSSProperties
                  }
                >
                  {pillar.services.map((service, s) => {
                    const flatIndex = ring * 3 + s;
                    const angle =
                      (s / pillar.services.length) * Math.PI * 2 - Math.PI / 2;
                    const radius = RADII[ring];
                    const isActive = flatIndex === activeIndex;
                    const Icon = service.icon;

                    return (
                      <button
                        key={service.title}
                        type="button"
                        onMouseEnter={() => setHovered(flatIndex)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(flatIndex)}
                        onBlur={() => setHovered(null)}
                        aria-pressed={isActive}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        style={{
                          left:
                            (50 + Math.cos(angle) * radius).toFixed(3) + "%",
                          top: (50 + Math.sin(angle) * radius).toFixed(3) + "%",
                        }}
                      >
                        <span
                          className="orbit-node-inner flex size-11 items-center justify-center rounded-full border transition-colors duration-300"
                          data-paused={paused}
                          style={
                            {
                              "--orbit-duration": DURATIONS[ring] + "s",
                              borderColor: isActive
                                ? "var(--primary)"
                                : "color-mix(in oklab, var(--primary) 38%, transparent)",
                              backgroundColor: isActive
                                ? "color-mix(in oklab, var(--primary) 22%, var(--background))"
                                : "var(--background)",
                            } as CSSProperties
                          }
                        >
                          <Icon aria-hidden className="size-5 text-primary" />
                          <span className="sr-only">
                            {pillar.title}: {service.title}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              <div
                className={cn(
                  "pointer-events-none absolute inset-[33%] flex flex-col items-center justify-center rounded-full border border-border bg-background/85 text-center backdrop-blur-sm",
                  active.pillar.colorClass,
                )}
              >
                <ActiveIcon aria-hidden className="size-7 text-primary" />
                <p className="mt-2 px-4 font-mono text-[0.6rem] tracking-[0.2em] text-primary uppercase">
                  {active.pillar.state}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className={active.pillar.colorClass}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card/40">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.key}
                  initial={reduce ? false : { opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  {active.visual.photo ? (
                    <Image
                      src={active.visual.photo.src}
                      alt={active.visual.photo.alt}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 p-6 text-foreground/70">
                      {active.visual.graphic}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 min-h-36">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.key}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.32 }}
                >
                  <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
                    {active.pillar.title}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-balance">
                    {active.service.title}
                  </h3>
                  <p className="mt-3 text-pretty text-muted-foreground">
                    {active.service.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
