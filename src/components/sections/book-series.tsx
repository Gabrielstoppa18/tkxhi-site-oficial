import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { photos } from "@/lib/photos";

/**
 * A série Robótica Trip, publicada pela TkxHi Editora. Agora com as capas
 * reais — antes eram representações desenhadas em CSS, porque os arquivos
 * ainda não existiam no projeto.
 *
 * Depois das capas vêm páginas do miolo. Uma capa diz que o livro existe;
 * o miolo é o que convence uma escola de que ele funciona, porque mostra que
 * cada página é uma atividade e não um capítulo de teoria.
 *
 * A inclinação no hover é feita só com CSS — não vale carregar JavaScript por
 * um efeito que a folha de estilo resolve.
 */
const BOOKS = [
  {
    trip: "Trip 1",
    theme: "Espaço",
    cover: photos.capaTrip1,
    blurb:
      "A primeira viagem: ligar, mover e fazer o robô obedecer a uma sequência.",
  },
  {
    trip: "Trip 2",
    theme: "Água",
    cover: photos.capaTrip2,
    blurb:
      "A segunda: sensores entram em cena e o robô passa a reagir ao que encontra.",
  },
  {
    trip: "Trip 3",
    theme: "Ar",
    cover: photos.capaTrip3,
    blurb:
      "A terceira: rotinas mais longas, decisões encadeadas e projetos próprios.",
  },
];

const SPREADS = [
  {
    photo: photos.atividadeCartinhas,
    caption:
      "Cartinhas de programação: a rotina é montada na mesa antes de virar código.",
  },
  {
    photo: photos.atividadeSensores,
    caption:
      "Cada componente explicado por comparação — o ultrassônico é o morcego, o Nano é o cérebro.",
  },
  {
    photo: photos.atividadeBlocos,
    caption:
      "O envio do programa pelo aplicativo, passo a passo, com os blocos que o aluno vai encaixar.",
  },
  {
    photo: photos.atividadeCaminhos,
    caption: "Percursos em grade para o robô atravessar seguindo as setas.",
  },
  {
    photo: photos.atividadeTrilha,
    caption:
      "Trilhas destacáveis: a folha sai do livro e vira o cenário da aula.",
  },
  {
    photo: photos.atividadeDescarte,
    caption:
      "Descarte correto e sustentabilidade entram no mesmo material da robótica.",
  },
];

export function BookSeries() {
  return (
    <section className="border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Catálogo"
            title="Robótica Trip."
            lead="Três volumes que acompanham o TurTle-T por três ambientes — espaço, água e ar. Escritos para a sala de aula, não para a estante."
          />
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {BOOKS.map((book, index) => (
            <Reveal key={book.trip} delay={index * 0.08}>
              <article className="group [perspective:1400px]">
                <div className="relative aspect-[1152/1600] overflow-hidden rounded-sm shadow-[0_20px_45px_-25px_rgba(0,0,0,0.7)] transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(-13deg)_rotateX(3deg)]">
                  <Image
                    src={book.cover.src}
                    alt={book.cover.alt}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                  {/* Sombra de lombada: dá espessura ao objeto. */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/45 to-transparent"
                  />
                </div>

                <p className="mt-5 font-mono text-[0.65rem] tracking-[0.2em] text-primary uppercase">
                  {book.trip} · {book.theme}
                </p>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {book.blurb}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-20 border-t border-border pt-12">
            <h3 className="font-display text-2xl font-bold tracking-tight">
              Por dentro do livro.
            </h3>
            <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
              Cada página é uma atividade. O aluno recorta, monta a sequência na
              mesa, programa no navegador e vê o robô executar.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SPREADS.map((spread, index) => (
            <Reveal key={spread.photo.src} delay={(index % 3) * 0.07}>
              <figure>
                <div className="relative aspect-[558/799] overflow-hidden rounded-sm border border-border bg-white">
                  <Image
                    src={spread.photo.src}
                    alt={spread.photo.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-sm text-pretty text-muted-foreground">
                  {spread.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
