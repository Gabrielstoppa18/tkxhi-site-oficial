"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { photos } from "@/lib/photos";

/**
 * O TurTle-T é o caso que mostra as três frentes trabalhando juntas: eletrônica
 * e firmware (Engenharia), chassi e suportes impressos (Impressão 3D) e o
 * material didático que ensina a usá-lo (Editora).
 *
 * A peça é interativa pelo mesmo motivo que a engrenagem e as órbitas: explicar
 * um robô com uma lista de itens desperdiça o fato de que ele é um objeto com
 * partes em lugares específicos. Aqui cada ponto vive onde a peça fica.
 *
 * As descrições saem do próprio material da TkxHi Editora, na linguagem que o
 * livro usa com as crianças.
 */
const PARTS = [
  {
    id: "ultrassonico",
    label: "Sensor ultrassônico",
    x: 62,
    y: 30,
    what: "Ajuda o TurTle-T a enxergar se tem algo no caminho, usando um som que a gente não escuta.",
    like: "É o mesmo truque do morcego, que não bate nas coisas no escuro.",
  },
  {
    id: "infravermelho",
    label: "Sensor de infravermelho",
    x: 44,
    y: 58,
    what: "Lê o chão e diferencia tons de cinza, do branco total ao preto sem luz. É o que permite seguir uma linha.",
    like: "São os olhinhos: enxergam claro e escuro, mas não enxergam cor.",
  },
  {
    id: "controlador",
    label: "Microcontrolador",
    x: 30,
    y: 40,
    what: "Recebe a programação e comanda motores e sensores. Um Arduino cuida da lógica inteira do robô.",
    like: "É o cérebro, onde fica a memória e de onde saem as decisões.",
  },
  {
    id: "impressas",
    label: "Chassi e suportes impressos",
    x: 50,
    y: 78,
    what: "Estrutura, berços de sensor e presilhas saem da impressora 3D — o que permite refazer uma peça no mesmo dia em que o teste apontou o problema.",
    like: "É a manufatura aditiva servindo ao projeto, não o contrário.",
  },
  {
    id: "blocos",
    label: "Programação em blocos",
    x: 78,
    y: 62,
    what: "O aluno monta a rotina encaixando blocos no navegador e envia para o robô, sem precisar escrever código para começar.",
    like: "Da primeira aula até o código de verdade, sem trocar de ferramenta.",
  },
];

export function TurtleT() {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState(PARTS[0].id);
  const active = PARTS.find((part) => part.id === activeId) ?? PARTS[0];

  return (
    <section className="border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Caso · TurTle-T"
            title="Um robô que atravessa as três frentes."
            lead="Eletrônica e firmware pela Engenharia, chassi e suportes pela Impressão 3D, material didático pela Editora. O mesmo projeto, do circuito à sala de aula."
          />
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="material-draft relative aspect-[4/3] w-full rounded-lg border border-border bg-card/40">
              <svg
                viewBox="0 0 100 75"
                aria-hidden
                className="absolute inset-0 h-full w-full p-6"
              >
                {/* Esteiras */}
                <rect
                  x="18"
                  y="42"
                  width="64"
                  height="22"
                  rx="11"
                  fill="currentColor"
                  opacity="0.12"
                />
                <circle
                  cx="28"
                  cy="53"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  opacity="0.45"
                />
                <circle
                  cx="72"
                  cy="53"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  opacity="0.45"
                />
                {/* Corpo */}
                <rect
                  x="26"
                  y="28"
                  width="48"
                  height="20"
                  rx="4"
                  fill="var(--primary)"
                  opacity="0.18"
                  stroke="var(--primary)"
                  strokeWidth="1.2"
                />
                {/* Placa */}
                <rect
                  x="30"
                  y="34"
                  width="14"
                  height="9"
                  rx="1.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.5"
                />
                {/* Módulo ultrassônico: dois transdutores */}
                <rect
                  x="54"
                  y="24"
                  width="18"
                  height="9"
                  rx="3"
                  fill="var(--primary)"
                  opacity="0.3"
                />
                <circle
                  cx="59.5"
                  cy="28.5"
                  r="2.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  opacity="0.65"
                />
                <circle
                  cx="66.5"
                  cy="28.5"
                  r="2.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.1"
                  opacity="0.65"
                />
                {/* Onda de ultrassom */}
                <path
                  d="M76 24 a10 10 0 0 1 0 9"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.2"
                  opacity="0.55"
                />
                <path
                  d="M80 21 a15 15 0 0 1 0 15"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1"
                  opacity="0.3"
                />
                {/* Antena */}
                <line
                  x1="34"
                  y1="28"
                  x2="34"
                  y2="20"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  opacity="0.5"
                />
                <circle
                  cx="34"
                  cy="19"
                  r="1.8"
                  fill="var(--primary)"
                  opacity="0.8"
                />
                {/* Linha do chão que o infravermelho lê */}
                <line
                  x1="10"
                  y1="68"
                  x2="90"
                  y2="68"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.3"
                  strokeDasharray="3 3"
                />
              </svg>

              {PARTS.map((part) => {
                const isActive = part.id === activeId;
                return (
                  <button
                    key={part.id}
                    type="button"
                    onMouseEnter={() => setActiveId(part.id)}
                    onFocus={() => setActiveId(part.id)}
                    onClick={() => setActiveId(part.id)}
                    aria-pressed={isActive}
                    className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    style={{ left: `${part.x}%`, top: `${part.y}%` }}
                  >
                    <span
                      className="block rounded-full border-2 border-primary transition-all duration-300"
                      style={{
                        width: isActive ? "1.15rem" : "0.7rem",
                        height: isActive ? "1.15rem" : "0.7rem",
                        backgroundColor: isActive
                          ? "var(--primary)"
                          : "var(--background)",
                      }}
                    />
                    <span className="sr-only">{part.label}</span>
                  </button>
                );
              })}

              <p className="pointer-events-none absolute bottom-3 left-4 font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                Toque nos pontos
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="flex flex-wrap gap-2">
              {PARTS.map((part) => (
                <li key={part.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveId(part.id)}
                    onFocus={() => setActiveId(part.id)}
                    onClick={() => setActiveId(part.id)}
                    aria-pressed={part.id === activeId}
                    className="rounded-full border px-3 py-2 font-mono text-[0.65rem] tracking-[0.14em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    style={{
                      borderColor:
                        part.id === activeId
                          ? "var(--primary)"
                          : "var(--border)",
                      color:
                        part.id === activeId
                          ? "var(--primary)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    {part.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8 min-h-52">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-display text-2xl font-bold tracking-tight">
                    {active.label}
                  </h3>
                  <p className="mt-4 text-pretty">{active.what}</p>
                  <p className="mt-3 text-pretty text-muted-foreground italic">
                    {active.like}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <a
              href="https://turtle-t.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Abrir o ambiente de programação do TurTle-T
              <ExternalLink aria-hidden className="size-4" />
            </a>
          </Reveal>
        </div>

        {/* O diagrama explica; as fotos provam que existe. */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              photos.turtleCompleto,
              "Chassi, cúpula e berço de sensor saem da impressora.",
            ],
            [
              photos.turtleSensor,
              "O módulo ultrassônico encaixado no suporte impresso.",
            ],
            [
              photos.turtleBancada,
              "Placa, sensores e fiação antes de virar robô.",
            ],
            [
              photos.turtleMontagem,
              "A montagem é parte da aula, não trabalho de bastidor.",
            ],
          ].map(([photo, caption], index) => (
            <Reveal key={(photo as { src: string }).src} delay={index * 0.06}>
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border">
                  <Image
                    src={(photo as { src: string }).src}
                    alt={(photo as { alt: string }).alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-sm text-pretty text-muted-foreground">
                  {caption as string}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
