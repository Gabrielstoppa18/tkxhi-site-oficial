import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { MediaFrame } from "@/components/media-frame";
import { Schematic } from "@/components/graphics/schematic";
import { LayerStack } from "@/components/graphics/layer-stack";
import { PageSpread } from "@/components/graphics/page-spread";

/**
 * Um quadro por frente. As ilustrações ficam no lugar até as fotos reais da
 * bancada existirem — quando existirem, passe `photo` para a moldura.
 *
 * Fotos a produzir, na ordem:
 *   1. placa de circuito em bancada, com instrumento à vista
 *   2. peça saindo da impressora, camadas visíveis, mesa ao fundo
 *   3. livro ou manual impresso aberto, luz lateral
 */
const FRAMES = [
  {
    colorClass: "pillar-engenharia",
    eyebrow: "Engenharia",
    caption:
      "Do esquema à placa: definição de requisitos, escolha de componentes e validação em bancada.",
    graphic: <Schematic />,
  },
  {
    colorClass: "pillar-impressao-3d",
    eyebrow: "Impressão 3D",
    caption:
      "Camadas de 0,2 mm empilhadas até a peça. Geometria livre, sem molde e sem lote mínimo.",
    graphic: <LayerStack />,
  },
  {
    colorClass: "pillar-editora",
    eyebrow: "Editora",
    caption:
      "Página dupla, mancha de texto e figura numerada. O projeto vira documento que outra pessoa consegue seguir.",
    graphic: <PageSpread />,
  },
];

export function Gallery() {
  return (
    <section className="border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Da bancada"
            title="Três ofícios, três materiais."
            lead="Cada frente trabalha com uma matéria-prima diferente e deixa um vestígio diferente."
          />
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMES.map((frame, index) => (
            <Reveal
              key={frame.eyebrow}
              delay={index * 0.08}
              className={frame.colorClass}
            >
              <MediaFrame eyebrow={frame.eyebrow} caption={frame.caption}>
                {frame.graphic}
              </MediaFrame>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
