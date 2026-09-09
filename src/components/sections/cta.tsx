import { Mail } from "lucide-react";
import { CircuitField } from "@/components/circuit-field";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export function Cta() {
  return (
    <section
      id="contato"
      className="relative isolate scroll-mt-16 overflow-hidden"
    >
      <CircuitField className="[mask-image:radial-gradient(ellipse_65%_75%_at_50%_100%,black,transparent)] text-foreground/[0.07]" />
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
            Próximo passo
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Conte o que você quer construir.
          </h2>
          <p className="mt-5 text-lg text-pretty text-muted-foreground">
            Descreva o problema em duas linhas. Respondemos dizendo se é viável,
            por onde começaríamos e o que precisamos saber para orçar.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={`mailto:${siteConfig.contact.email}`}>
                <Mail aria-hidden />
                {siteConfig.contact.email}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
