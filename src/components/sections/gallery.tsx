import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { MediaFrame } from "@/components/media-frame";
import { Schematic } from "@/components/graphics/schematic";
import { LayerStack } from "@/components/graphics/layer-stack";
import { PageSpread } from "@/components/graphics/page-spread";
import { stockPhotos } from "@/lib/photos";

/**
 * Dois quadros por frente: uma foto do ofício e o desenho técnico que explica
 * o que a foto mostra. A alternância entre fotografia e diagrama é o ritmo da
 * seção — nenhuma frente aparece só de um jeito.
 *
 * As fotos são de banco de imagens; veja o aviso em src/lib/photos.ts.
 */
const FRAMES = [
  {
    colorClass: "pillar-engenharia",
    eyebrow: "Engenharia",
    caption:
      "Montagem e validação em bancada: componente posicionado, solda conferida, comportamento medido.",
    photo: stockPhotos.engenhariaBancada,
  },
  {
    colorClass: "pillar-engenharia",
    eyebrow: "Engenharia · esquema",
    caption:
      "Antes da placa existe o esquema: encapsulamento, pinagem e roteamento definidos no papel.",
    graphic: <Schematic />,
  },
  {
    colorClass: "pillar-impressao-3d",
    eyebrow: "Impressão 3D",
    caption:
      "Produção sem molde e sem lote mínimo: a mesma máquina faz o protótipo e a peça de uso final.",
    photo: stockPhotos.impressaoMaquinas,
  },
  {
    colorClass: "pillar-impressao-3d",
    eyebrow: "Impressão 3D · corte",
    caption:
      "Camadas de 0,2 mm empilhadas até a peça. É a altura de camada que decide acabamento e tempo.",
    graphic: <LayerStack />,
  },
  {
    colorClass: "pillar-editora",
    eyebrow: "Editora",
    caption:
      "O impresso ainda é o formato em que o conhecimento técnico envelhece melhor.",
    photo: stockPhotos.editoraPaginas,
  },
  {
    colorClass: "pillar-editora",
    eyebrow: "Editora · diagramação",
    caption:
      "Mancha de texto, figura numerada e fólio: a página é projetada como qualquer outra peça.",
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
            lead="Cada frente trabalha com uma matéria-prima diferente e deixa um vestígio diferente. À direita de cada foto, o desenho que a explica."
          />
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMES.map((frame, index) => (
            <Reveal
              key={frame.eyebrow}
              delay={(index % 3) * 0.08}
              className={frame.colorClass}
            >
              <MediaFrame
                eyebrow={frame.eyebrow}
                caption={frame.caption}
                photo={frame.photo}
              >
                {frame.graphic}
              </MediaFrame>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
