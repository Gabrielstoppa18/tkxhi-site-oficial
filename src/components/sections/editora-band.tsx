import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { PageSpread } from "@/components/graphics/page-spread";

/**
 * A Editora entra como uma folha de prova saindo da impressora: marcas de
 * registro nos cantos, barra de cores na borda e o título ligeiramente fora de
 * registro, com o fantasma ciano e magenta que denuncia a impressão em
 * camadas sobrepostas.
 *
 * Não é ornamento: é o mesmo argumento do site inteiro — nada aqui sai pronto
 * de uma vez, tudo se forma por passadas. E é o lugar onde a casa mostra que
 * livro não precisa ser assunto sóbrio.
 */

/** Barra de cores: as tintas da marca, como numa tira de controle de prova. */
const INK_BAR = [
  "#00a725",
  "#18702e",
  "#fea520",
  "#fe7c20",
  "#e1511b",
  "#d457c7",
  "#822ca3",
  "#350049",
];

function RegistrationMark({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={"pointer-events-none absolute size-8 opacity-40 " + className}
    >
      <span className="registration-mark absolute inset-0 block text-foreground" />
      <span className="absolute inset-[30%] rounded-full border border-current" />
    </span>
  );
}

export function EditoraBand() {
  return (
    <section className="register-paper pillar-editora material-halftone relative border-y border-border/70">
      <RegistrationMark className="top-6 left-6" />
      <RegistrationMark className="top-6 right-6" />
      <RegistrationMark className="bottom-6 left-6" />
      <RegistrationMark className="right-6 bottom-6" />

      {/* Tira de controle de tinta, como na margem de uma folha impressa. */}
      <div
        aria-hidden
        className="absolute top-0 right-0 bottom-0 hidden w-6 flex-col lg:flex"
      >
        {INK_BAR.map((ink) => (
          <span key={ink} className="flex-1" style={{ backgroundColor: ink }} />
        ))}
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32 lg:pr-16">
        <div className="grid gap-14 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
              TkxHi Editora — folha de prova
            </p>

            <blockquote className="mt-8 font-serif text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.08] tracking-[-0.02em]">
              <span className="block">Um projeto entregue</span>
              <span className="block">resolve um problema.</span>
              <em className="misregistered mt-4 block italic">
                Um projeto publicado resolve
              </em>
              <em className="misregistered block italic">
                para quem vier depois.
              </em>
            </blockquote>

            <p className="mt-10 max-w-xl text-pretty text-muted-foreground">
              Por isso a editora existe dentro de uma empresa de engenharia.
              Publicamos livros, artigos técnicos, manuais e e-books — nossos e
              de autores que precisam de estrutura editorial para chegar lá.
            </p>

            <Link
              href="/editora"
              className="mt-8 inline-flex items-center gap-2 rounded-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Conhecer a editora
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-5">
            {/* A página como peça de projeto, com cota de mancha. */}
            <div className="relative rotate-[-1.25deg] border border-border bg-card p-6 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)]">
              <div className="aspect-[4/3] text-foreground/75">
                <PageSpread />
              </div>
              <p className="mt-4 border-t border-border pt-3 font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                Mancha 125 × 176 mm · fólio externo
              </p>
            </div>

            <dl className="mt-10 divide-y divide-border">
              {[
                ["Livros e artigos técnicos", "Edição e lançamento"],
                ["Revisão e copidesque", "Clareza e correção"],
                ["Consultoria editorial", "Do plano ao lançamento"],
              ].map(([term, detail]) => (
                <div key={term} className="flex justify-between gap-6 py-4">
                  <dt className="font-medium">{term}</dt>
                  <dd className="text-right font-mono text-xs tracking-wide text-muted-foreground">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
