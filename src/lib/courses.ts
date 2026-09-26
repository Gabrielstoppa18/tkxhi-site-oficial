import { Bolt, Factory, Layers, Scissors, type LucideIcon } from "lucide-react";

/**
 * Cursos presenciais: o conteúdo (programa, textos) fica no código, porque
 * muda pouco e passa por revisão como qualquer texto do site. As turmas —
 * data, local, preço, vagas e política de reembolso — ficam no banco e são
 * gerenciadas em /admin/turmas.
 */
export type CohortStatus = "draft" | "open" | "closed" | "cancelled";

/** Turma como a interface a enxerga: datas em ISO, serializável para o navegador. */
export type Cohort = {
  id: string;
  courseId: string;
  label: string | null;
  startsAt: string;
  endsAt: string;
  venue: string;
  address: string;
  priceCents: number;
  capacity: number;
  lateRefundPercent: number;
  lateRefundDaysBefore: number;
  status: CohortStatus;
};

/**
 * Política padrão para turma nova. Fora dos 7 dias do direito de
 * arrependimento: quem não participou e pede com antecedência recebe a
 * porcentagem de volta automaticamente. Cada turma pode mudar os números.
 */
export const DEFAULT_REFUND_POLICY = {
  lateRefundPercent: 50,
  lateRefundDaysBefore: 3,
} as const;

export type CourseModule = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type Course = {
  slug: string;
  title: string;
  edition: string;
  tagline: string;
  lead: string;
  authors: string;
  modules: CourseModule[];
  materials: string[];
  software: string[];
  requirements: string;
};

export const courses: Course[] = [
  {
    slug: "impressao-3d-basic",
    title: "Impressão 3D: Basic",
    edition: "2026",
    tagline: "Pense, prepare, imprima!",
    lead: "Os fundamentos da manufatura aditiva, da anatomia da impressora ao fatiamento, para transformar uma ideia em peça na mesa.",
    authors: "G. P. Stoppa & M. H. Stoppa",
    modules: [
      {
        title: "Introdução",
        description:
          "História, tecnologias (FDM, SLA, SLS), o projeto RepRap e a anatomia da impressora Ender 3.",
        icon: Factory,
      },
      {
        title: "Manutenção",
        description:
          "Preservação, limpeza, lubrificação, troca de filamento e solução de falhas comuns como warping e stringing.",
        icon: Bolt,
      },
      {
        title: "Configuração",
        description:
          "Painel de controle, pré-aquecimento, nivelamento da mesa e a distância correta do bico.",
        icon: Layers,
      },
      {
        title: "Fatiamento",
        description:
          "OrcaSlicer na prática: parâmetros de qualidade e resistência, suportes e calibração.",
        icon: Scissors,
      },
    ],
    materials: ["PLA (foco prático)", "ABS", "PETG", "TPU"],
    software: ["OrcaSlicer (foco principal)", "Cura", "PrusaSlicer"],
    requirements: "Notebook que rode o OrcaSlicer.",
  },
];

export function courseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function courseHref(course: Pick<Course, "slug">): string {
  return `/cursos/${course.slug}`;
}

/** Carga horária em horas inteiras, para a página e o certificado. */
export function cohortHours(
  cohort: Pick<Cohort, "startsAt" | "endsAt">,
): number {
  const ms = Date.parse(cohort.endsAt) - Date.parse(cohort.startsAt);
  return Math.max(1, Math.round(ms / 3_600_000));
}
