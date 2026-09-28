import {
  Bolt,
  BookOpen,
  Bot,
  Box,
  Code,
  Cpu,
  Factory,
  FlaskConical,
  Layers,
  Lightbulb,
  Palette,
  Printer,
  Ruler,
  Scissors,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { PhotoKey } from "@/lib/photos";

/**
 * Cursos presenciais e suas turmas. Os dois ficam no banco: o curso (textos,
 * programa, materiais) é gerenciado em /admin/cursos e a turma (data, local,
 * preço, vagas, política de reembolso) em /admin/turmas.
 *
 * Este arquivo só tem tipos e tabelas fixas — é importado também pelo
 * navegador. A leitura do banco está em src/lib/server/courses.ts.
 */

export type CoursePillar = "engenharia" | "impressao-3d" | "editora";
export type CourseStatus = "draft" | "published" | "archived";

/**
 * Cada curso pertence a uma frente e herda cor e textura dela — o mesmo
 * sistema das páginas internas (ver CLAUDE.md, "Sistema visual").
 */
export const COURSE_PILLARS: Record<
  CoursePillar,
  { label: string; colorClass: string; material: string; href: string }
> = {
  engenharia: {
    label: "Engenharia",
    colorClass: "pillar-engenharia",
    material: "material-draft",
    href: "/engenharia",
  },
  "impressao-3d": {
    label: "Impressão 3D",
    colorClass: "pillar-impressao-3d",
    material: "material-layered",
    href: "/impressao-3d",
  },
  editora: {
    label: "Editora",
    colorClass: "pillar-editora",
    material: "material-halftone",
    href: "/editora",
  },
};

/** Ícones disponíveis para os módulos. O banco guarda só a chave. */
export const COURSE_ICONS = {
  factory: { icon: Factory, label: "Fábrica" },
  bolt: { icon: Bolt, label: "Manutenção" },
  layers: { icon: Layers, label: "Camadas" },
  scissors: { icon: Scissors, label: "Fatiamento" },
  printer: { icon: Printer, label: "Impressora" },
  cpu: { icon: Cpu, label: "Eletrônica" },
  bot: { icon: Bot, label: "Robótica" },
  code: { icon: Code, label: "Programação" },
  wrench: { icon: Wrench, label: "Ferramentas" },
  settings: { icon: Settings, label: "Configuração" },
  ruler: { icon: Ruler, label: "Projeto" },
  box: { icon: Box, label: "Peça" },
  lightbulb: { icon: Lightbulb, label: "Ideia" },
  flask: { icon: FlaskConical, label: "Experimento" },
  palette: { icon: Palette, label: "Design" },
  book: { icon: BookOpen, label: "Leitura" },
} satisfies Record<string, { icon: LucideIcon; label: string }>;

export type CourseIconKey = keyof typeof COURSE_ICONS;

export function isCourseIcon(value: string): value is CourseIconKey {
  return Object.hasOwn(COURSE_ICONS, value);
}

export type CourseModule = {
  title: string;
  description: string;
  icon: CourseIconKey;
};

export type Course = {
  slug: string;
  pillar: CoursePillar;
  title: string;
  edition: string;
  tagline: string;
  lead: string;
  authors: string;
  modules: CourseModule[];
  materials: string[];
  software: string[];
  requirements: string;
  photo: PhotoKey;
  status: CourseStatus;
  position: number;
};

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
