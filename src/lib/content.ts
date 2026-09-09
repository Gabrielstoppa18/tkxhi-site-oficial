import { BookOpen, Layers, PenTool, type LucideIcon } from "lucide-react";

/**
 * Os três braços da TkxHi, tratados como três estados por que passa uma ideia:
 * projeto (desenho), matéria (peça) e registro (publicação). A ordem do array é
 * a ordem do percurso, e cada frente carrega uma das três famílias de cor da
 * marca. A Editora troca de registro material: imprime em papel, não em tela.
 */
export type Register = "screen" | "paper";

export type Pillar = {
  slug: string;
  /** Classe que reconfigura --primary para a família de cor da frente. */
  colorClass: string;
  /** Cor da palavra correspondente no título do hero. */
  stria: string;
  href: string;
  state: string;
  /** Verbo da frente no título do hero — a ordem do array é a ordem das linhas. */
  verb: string;
  title: string;
  lead: string;
  summary: string;
  services: { title: string; description: string }[];
  cta: string;
  icon: LucideIcon;
  register: Register;
};

export const pillars: Pillar[] = [
  {
    slug: "engenharia",
    colorClass: "pillar-engenharia",
    stria: "#4dff73",
    href: "/engenharia",
    state: "Projeto",
    verb: "Projetamos",
    title: "Engenharia",
    lead: "A ideia ganha forma, requisito e viabilidade.",
    summary:
      "Projetos e consultoria em hardware, software, inteligência artificial e prototipagem. Combinamos rigor técnico e método ágil para levar um problema complexo da concepção à implantação.",
    services: [
      {
        title: "Consultoria e viabilidade técnica",
        description:
          "Análise aprofundada do projeto e estudo de viabilidade antes de qualquer linha de código ou grama de material.",
      },
      {
        title: "Desenvolvimento e otimização de produtos",
        description:
          "Design, prototipagem e testes até a produção, com iterações curtas e decisões documentadas.",
      },
      {
        title: "Automação e sistemas inteligentes",
        description:
          "Sistemas automatizados, robótica e inteligência artificial aplicados a processos reais.",
      },
    ],
    cta: "Falar com a engenharia",
    icon: PenTool,
    register: "screen",
  },
  {
    slug: "impressao-3d",
    colorClass: "pillar-impressao-3d",
    stria: "#fea520",
    href: "/impressao-3d",
    state: "Matéria",
    verb: "Imprimimos",
    title: "Impressão 3D",
    lead: "A ideia sai da tela e passa a ter peso.",
    summary:
      "Manufatura aditiva da prototipagem rápida à peça de uso final. Transformamos arquivos em objetos com fidelidade dimensional e sem o custo fixo do ferramental tradicional.",
    services: [
      {
        title: "Prototipagem rápida e funcional",
        description:
          "Protótipos de alta fidelidade para testar conceito, forma e função antes da produção final.",
      },
      {
        title: "Produção de peças sob demanda",
        description:
          "Componentes personalizados, ferramentas, gabaritos e peças de uso final em diversos materiais, sem desperdício.",
      },
      {
        title: "Arte, design e personalizados",
        description:
          "Esculturas, maquetes arquitetônicas e peças complexas em que a liberdade geométrica é o ponto.",
      },
    ],
    cta: "Enviar um arquivo para orçamento",
    icon: Layers,
    register: "screen",
  },
  {
    slug: "editora",
    colorClass: "pillar-editora",
    stria: "#d457c7",
    href: "/editora",
    state: "Registro",
    verb: "Publicamos",
    title: "Editora",
    lead: "A ideia vira conhecimento que outra pessoa pode usar.",
    summary:
      "Curadoria, edição e publicação de conteúdo técnico e científico. O que aprendemos em um projeto não deveria morrer junto com ele.",
    services: [
      {
        title: "Publicações técnicas e livros digitais",
        description:
          "Edição e lançamento de livros, artigos técnicos, manuais e e-books em tecnologia e engenharia.",
      },
      {
        title: "Design gráfico e edição de conteúdo",
        description:
          "Revisão textual, copidesque e edição para garantir clareza, correção e impacto no material.",
      },
      {
        title: "Consultoria editorial e lançamento",
        description:
          "Orientação estratégica para autores, planejamento da publicação e suporte no lançamento.",
      },
    ],
    cta: "Enviar uma proposta de publicação",
    icon: BookOpen,
    register: "paper",
  },
];

/**
 * O percurso de um projeto. Aqui a numeração carrega informação de verdade —
 * as etapas acontecem nesta ordem e uma depende da anterior.
 */
export const processSteps = [
  {
    title: "Viabilidade",
    description:
      "Entendemos a restrição real — prazo, custo, norma, física — e dizemos com franqueza o que é possível.",
  },
  {
    title: "Projeto",
    description:
      "Requisitos, arquitetura e desenho técnico. É aqui que a maior parte do custo de um produto é decidida.",
  },
  {
    title: "Protótipo",
    description:
      "A primeira peça na mão. Testar cedo é mais barato que corrigir depois da ferramenta pronta.",
  },
  {
    title: "Produção",
    description:
      "Lotes sob demanda, com o mesmo arquivo que foi validado no protótipo. Sem molde, sem lote mínimo.",
  },
  {
    title: "Registro",
    description:
      "Manual, artigo ou livro. O projeto termina documentado, não apenas entregue.",
  },
] as const;

export function pillarBySlug(slug: string): Pillar | undefined {
  return pillars.find((pillar) => pillar.slug === slug);
}
