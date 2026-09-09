"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useInView, useReducedMotion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";

/**
 * O three.js só é baixado quando esta seção entra em cena — são centenas de
 * kilobytes que não podem pesar no carregamento inicial da home.
 */
const PrintedPart = dynamic(() => import("@/components/three/printed-part"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

/** Altura real que a peça representaria, para o leitor ter escala. */
const PART_HEIGHT_MM = 16;
const BUILD_MS = 2600;

function ViewerSkeleton() {
  return <div className="h-full w-full animate-pulse bg-card/40" aria-hidden />;
}

export function PartViewer() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: false, margin: "-120px" });

  const [progress, setProgress] = useState(reduce ? 1 : 0);
  const [manual, setManual] = useState(false);
  const started = useRef(false);
  const frame = useRef<number | null>(null);

  const runBuild = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / BUILD_MS, 1);
      // Desacelera no fim, como a máquina fechando as últimas camadas.
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (reduce || manual || started.current || !inView) return;
    started.current = true;
    runBuild();
  }, [inView, manual, reduce, runBuild]);

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const replay = () => {
    setManual(false);
    started.current = true;
    if (reduce) {
      setProgress(1);
      return;
    }
    setProgress(0);
    runBuild();
  };

  const heightMm = (progress * PART_HEIGHT_MM).toFixed(1).replace(".", ",");

  return (
    <section className="pillar-impressao-3d border-b border-border/70">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <SectionHeading
            eyebrow="Matéria"
            title="A peça se constrói camada por camada."
            lead="Manufatura aditiva não corta material de um bloco: deposita só onde precisa. É o que permite geometria livre, lote unitário e nenhum ferramental."
          />

          <dl className="mt-10 grid grid-cols-2 gap-px border-t border-border pt-6 font-mono text-xs sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Altura</dt>
              <dd className="mt-1 text-base text-primary tabular-nums">
                {heightMm} mm
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Camada</dt>
              <dd className="mt-1 text-base tabular-nums">0,2 mm</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Furos</dt>
              <dd className="mt-1 text-base tabular-nums">5 + eixo</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap items-end gap-6">
            <div className="min-w-56 flex-1">
              <label
                htmlFor="altura-de-camada"
                className="font-mono text-[0.7rem] tracking-[0.18em] uppercase"
              >
                Altura de deposição
              </label>
              <input
                id="altura-de-camada"
                type="range"
                min={0}
                max={1}
                step={0.005}
                value={progress}
                onChange={(event) => {
                  setManual(true);
                  if (frame.current !== null)
                    cancelAnimationFrame(frame.current);
                  setProgress(Number(event.target.value));
                }}
                aria-valuetext={`${heightMm} milímetros de ${PART_HEIGHT_MM}`}
                className="mt-3 w-full accent-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>
            <Button variant="outline" size="lg" onClick={replay}>
              <RotateCcw aria-hidden />
              Imprimir de novo
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div
            ref={containerRef}
            className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-card/30"
          >
            {inView || progress > 0 ? (
              <PrintedPart progress={progress} autoRotate={!reduce} />
            ) : (
              <ViewerSkeleton />
            )}
            <p className="pointer-events-none absolute bottom-3 left-4 font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
              Arraste para girar
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
