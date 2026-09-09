import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { processSteps } from "@/lib/content";

/**
 * O percurso desenhado como uma trilha: um trilho contínuo que sai do verde da
 * Engenharia, passa pelo laranja da Impressão 3D e termina no roxo da Editora.
 * O gradiente não é enfeite — é por onde o projeto realmente anda dentro da
 * casa, e cada etapa está pintada na cor da frente que a executa.
 *
 * O algarismo gigante vazado atrás de cada etapa dá a escala que a versão
 * anterior não tinha, sem competir com o texto por contraste.
 */
export function Process() {
  return (
    <section className="relative overflow-hidden border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Percurso"
            title="Como um projeto anda por aqui."
            lead="Cinco etapas, sempre nesta ordem, atravessando as três frentes. A quinta é a que a maioria das empresas pula."
          />
        </Reveal>

        <div className="relative mt-20">
          {/* Trilho: verde → laranja → roxo, o percurso pelas três frentes. */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-0.5 rounded-full bg-[linear-gradient(to_right,#4dff73_0%,#4dff73_28%,#fea520_45%,#fea520_68%,#d457c7_88%)]"
          />

          <ol className="grid gap-y-14 sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((step, index) => (
              <li key={step.title} className="group relative pt-10 lg:pr-6">
                {/* Nó sobre o trilho. */}
                <span
                  aria-hidden
                  className="absolute -top-[7px] left-0 size-4 rounded-full border-2 border-background transition-transform duration-300 group-hover:scale-125"
                  style={{ backgroundColor: step.accent }}
                />

                {/* Algarismo vazado: escala sem peso de contraste. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-2 right-2 font-display text-7xl font-extrabold text-transparent opacity-25 select-none lg:text-6xl"
                  style={{ WebkitTextStroke: "1px " + step.accent }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <Reveal delay={index * 0.06}>
                  <p
                    className="font-mono text-[0.65rem] tracking-[0.2em] uppercase"
                    style={{ color: step.accent }}
                  >
                    {step.frente}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-bold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 pr-4 text-sm text-pretty text-muted-foreground">
                    {step.description}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
