import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";

/**
 * A série Robótica Trip, publicada pela TkxHi Editora. Cada volume leva o
 * TurTle-T a um ambiente diferente — espaço, água e ar — e a capa de cada um
 * assume a cor daquela viagem.
 *
 * As capas aqui são representações desenhadas em CSS, não digitalizações: a
 * proporção, a lombada e a hierarquia são as do livro, mas a arte real ainda
 * não está em public/. Trocar por foto da capa é trocar o miolo do <article>.
 *
 * A inclinação no hover é feita só com CSS — não vale carregar JavaScript para
 * um efeito que a folha de estilo resolve.
 */
const BOOKS = [
  {
    trip: "Trip 1",
    theme: "Espaço",
    from: "#3b2a9c",
    to: "#6d4bd6",
    accent: "#7fd4ff",
    blurb:
      "A primeira viagem: ligar, mover e fazer o robô obedecer a uma sequência.",
  },
  {
    trip: "Trip 2",
    theme: "Água",
    from: "#0a7a35",
    to: "#18a94b",
    accent: "#ffd04d",
    blurb:
      "A segunda: sensores entram em cena e o robô passa a reagir ao que encontra.",
  },
  {
    trip: "Trip 3",
    theme: "Ar",
    from: "#e07000",
    to: "#ff9a2b",
    accent: "#7ddc5a",
    blurb:
      "A terceira: rotinas mais longas, decisões encadeadas e projetos próprios.",
  },
];

const TOPICS = [
  "Cartinhas de programação para montar rotinas sem tela",
  "Sensor ultrassônico e infravermelho explicados na linguagem da criança",
  "Trilhas e labirintos para percorrer com o TurTle-T",
  "Atividades destacáveis e recortáveis",
  "Sustentabilidade e descarte correto",
  "Envio do programa pelo ambiente de blocos no navegador",
];

export function BookSeries() {
  return (
    <section className="border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Catálogo"
            title="Robótica Trip."
            lead="Três volumes que acompanham o TurTle-T em três ambientes. Escritos para a sala de aula: cada página é uma atividade, não um capítulo de teoria."
          />
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {BOOKS.map((book, index) => (
            <Reveal key={book.trip} delay={index * 0.08}>
              <article className="group [perspective:1400px]">
                <div
                  className="relative aspect-[1/1.414] overflow-hidden rounded-l-sm rounded-r-md shadow-[0_20px_45px_-25px_rgba(0,0,0,0.7)] transition-transform duration-500 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(-14deg)_rotateX(3deg)]"
                  style={{
                    backgroundImage: `linear-gradient(150deg, ${book.from}, ${book.to})`,
                  }}
                >
                  {/* Lombada */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-3 bg-black/25"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-3 w-px bg-white/25"
                  />

                  <div className="relative flex h-full flex-col p-5 text-white">
                    <p className="font-mono text-[0.6rem] tracking-[0.2em] text-white/70 uppercase">
                      TkxHi Editora
                    </p>

                    <h3 className="mt-6 font-display text-3xl leading-none font-extrabold tracking-tight">
                      Robótica
                    </h3>
                    <p
                      className="mt-1 font-display text-xl font-bold"
                      style={{ color: book.accent }}
                    >
                      {book.trip}
                    </p>

                    <span
                      aria-hidden
                      className="mt-auto block h-px w-full bg-white/25"
                    />
                    <div className="mt-3 flex items-baseline justify-between">
                      <p className="font-mono text-[0.6rem] tracking-[0.18em] text-white/80 uppercase">
                        {book.theme}
                      </p>
                      <p className="font-mono text-[0.6rem] tracking-[0.18em] text-white/60 uppercase">
                        Pack 1
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-sm text-pretty text-muted-foreground">
                  {book.blurb}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-16 border-t border-border pt-10">
            <h3 className="font-mono text-[0.7rem] tracking-[0.22em] uppercase">
              O que a série cobre
            </h3>
            <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {TOPICS.map((topic) => (
                <li key={topic} className="flex gap-3 text-pretty">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  />
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
