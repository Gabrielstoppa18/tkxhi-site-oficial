import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { processSteps } from "@/lib/content";

/**
 * Aqui a numeração carrega informação: as etapas acontecem nesta ordem e cada
 * uma depende da anterior. A linha que as atravessa é o percurso da peça.
 */
export function Process() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="Percurso"
          title="Como um projeto anda por aqui."
          lead="Cinco etapas, sempre nesta ordem. A quinta é a que a maioria das empresas pula."
        />
      </Reveal>

      <ol className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-5">
        {processSteps.map((step, index) => (
          <li key={step.title} className="relative h-full pt-6">
            <Reveal delay={index * 0.06}>
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-border"
              />
              <span
                aria-hidden
                className="absolute top-0 left-0 h-px w-8 bg-primary"
              />
              <span className="font-mono text-xs tracking-[0.18em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 pr-6 text-sm text-pretty text-muted-foreground">
                {step.description}
              </p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
