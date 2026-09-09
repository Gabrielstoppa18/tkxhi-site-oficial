import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { PageSpread } from "@/components/graphics/page-spread";

/**
 * O site muda de material aqui. A Editora não é mais uma seção escura: é papel,
 * com serifada, porque o produto dela é outro.
 */
export function EditoraBand() {
  return (
    <section className="register-paper border-y border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
              TkxHi Editora
            </p>
            <blockquote className="mt-6 font-serif text-3xl leading-[1.25] text-balance sm:text-4xl">
              Um projeto entregue resolve um problema.{" "}
              <em>
                Um projeto publicado resolve o mesmo problema para quem vier
                depois.
              </em>
            </blockquote>
            <p className="mt-8 max-w-xl text-pretty text-muted-foreground">
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
            <div className="mb-8 aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card/40 p-6 text-foreground/70">
              <PageSpread />
            </div>
            <dl className="divide-y divide-border">
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
