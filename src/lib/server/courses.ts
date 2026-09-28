import "server-only";
import { cache } from "react";
import {
  COURSE_PILLARS,
  isCourseIcon,
  type Course,
  type CourseModule,
  type CoursePillar,
  type CourseStatus,
} from "@/lib/courses";
import { photos, type PhotoKey } from "@/lib/photos";
import { audit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";

type CourseRow = {
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
  photo: string;
  status: CourseStatus;
  position: number;
};

function toCourse(row: CourseRow): Course {
  return {
    slug: row.slug,
    pillar: row.pillar,
    title: row.title,
    edition: row.edition,
    tagline: row.tagline,
    lead: row.lead,
    authors: row.authors,
    // Um ícone removido do código não quebra a página: cai no genérico.
    modules: (row.modules ?? []).map((module) => ({
      ...module,
      icon: isCourseIcon(module.icon) ? module.icon : "lightbulb",
    })),
    materials: row.materials ?? [],
    software: row.software ?? [],
    requirements: row.requirements,
    photo: (Object.hasOwn(photos, row.photo)
      ? row.photo
      : "turtleSensor") as PhotoKey,
    status: row.status,
    position: row.position,
  };
}

/**
 * Curso pelo slug, em qualquer situação (rascunho incluso) — o chamador decide
 * se pode mostrar. `cache` evita repetir a consulta dentro da mesma requisição.
 */
export const findCourse = cache(
  async (slug: string): Promise<Course | undefined> => {
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) return undefined;
    const [row] = await db()<CourseRow[]>`
      SELECT * FROM courses WHERE slug = ${slug}
    `;
    return row ? toCourse(row) : undefined;
  },
);

export async function listCourses(): Promise<Course[]> {
  const rows = await db()<CourseRow[]>`
    SELECT * FROM courses ORDER BY status = 'archived', position, title
  `;
  return rows.map(toCourse);
}

/** Título por slug, para listas do painel que mostram vários cursos. */
export async function courseTitles(): Promise<Map<string, string>> {
  const rows = await db()<{ slug: string; title: string }[]>`
    SELECT slug, title FROM courses
  `;
  return new Map(rows.map((row) => [row.slug, row.title]));
}

/**
 * Cursos publicados, para as páginas públicas. Nunca derruba a página: sem
 * banco (no build, por exemplo) devolve lista vazia até a próxima revalidação.
 */
export async function publishedCourses(): Promise<Course[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = await db()<CourseRow[]>`
      SELECT * FROM courses WHERE status = 'published' ORDER BY position, title
    `;
    return rows.map(toCourse);
  } catch (error) {
    console.warn(
      "Cursos indisponíveis",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/** Versão tolerante de findCourse para páginas públicas estáticas. */
export async function publicCourse(slug: string): Promise<Course | undefined> {
  if (!process.env.DATABASE_URL) return undefined;
  try {
    const course = await findCourse(slug);
    return course && course.status !== "draft" ? course : undefined;
  } catch (error) {
    console.warn(
      "Curso indisponível",
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
}

// ---- formulário -------------------------------------------------------------

export type CourseInput = Omit<Course, "slug"> & { slug: string };

const MAX_MODULES = 12;
const MAX_LIST = 15;

function lines(value: string, max: number): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_LIST)
    .map((item) => item.slice(0, max));
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function parseCourseForm(
  form: FormData,
): { ok: true; value: CourseInput } | { ok: false; error: string } {
  const text = (name: string, max: number) =>
    String(form.get(name) ?? "")
      .trim()
      .slice(0, max);

  const title = text("title", 80);
  if (title.length < 3) return { ok: false, error: "Informe o nome do curso." };

  const slug = slugify(text("slug", 80) || title);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error: "Endereço inválido: use letras, números e hífen.",
    };
  }

  const pillar = text("pillar", 20) as CoursePillar;
  if (!Object.hasOwn(COURSE_PILLARS, pillar)) {
    return { ok: false, error: "Escolha a frente do curso." };
  }

  const edition = text("edition", 20);
  const tagline = text("tagline", 120);
  const lead = text("lead", 400);
  const authors = text("authors", 120);
  if (
    !edition ||
    tagline.length < 3 ||
    lead.length < 10 ||
    authors.length < 3
  ) {
    return {
      ok: false,
      error: "Preencha edição, chamada, descrição e instrutores.",
    };
  }

  const titles = form
    .getAll("moduleTitle")
    .map((v) => String(v).trim().slice(0, 60));
  const descriptions = form
    .getAll("moduleDescription")
    .map((v) => String(v).trim().slice(0, 300));
  const icons = form.getAll("moduleIcon").map((v) => String(v));
  const modules: CourseModule[] = [];
  for (let i = 0; i < Math.min(titles.length, MAX_MODULES); i++) {
    if (!titles[i] && !descriptions[i]) continue;
    if (titles[i].length < 2 || (descriptions[i] ?? "").length < 5) {
      return {
        ok: false,
        error: `Módulo ${i + 1}: informe o título e uma descrição de pelo menos 5 caracteres.`,
      };
    }
    modules.push({
      title: titles[i],
      description: descriptions[i],
      icon: isCourseIcon(icons[i] ?? "")
        ? (icons[i] as CourseModule["icon"])
        : "lightbulb",
    });
  }
  if (modules.length === 0) {
    return { ok: false, error: "O curso precisa de pelo menos um módulo." };
  }

  const photo = text("photo", 40);
  if (!Object.hasOwn(photos, photo)) {
    return { ok: false, error: "Escolha a foto de abertura." };
  }

  const status = text("status", 12) as CourseStatus;
  if (!["draft", "published", "archived"].includes(status)) {
    return { ok: false, error: "Situação inválida." };
  }

  const position = Number(text("position", 4) || 0);
  if (!Number.isInteger(position) || position < 0 || position > 999) {
    return { ok: false, error: "Ordem: um número inteiro de 0 a 999." };
  }

  return {
    ok: true,
    value: {
      slug,
      pillar,
      title,
      edition,
      tagline,
      lead,
      authors,
      modules,
      materials: lines(String(form.get("materials") ?? ""), 60),
      software: lines(String(form.get("software") ?? ""), 60),
      requirements: text("requirements", 200),
      photo: photo as PhotoKey,
      status,
      position,
    },
  };
}

export async function createCourse(
  input: CourseInput,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sql = db();
  const [row] = await sql<{ slug: string }[]>`
    INSERT INTO courses (slug, pillar, title, edition, tagline, lead, authors,
      modules, materials, software, requirements, photo, status, position, created_by)
    VALUES (${input.slug}, ${input.pillar}, ${input.title}, ${input.edition},
      ${input.tagline}, ${input.lead}, ${input.authors},
      ${sql.json(input.modules)}, ${input.materials}, ${input.software},
      ${input.requirements}, ${input.photo}, ${input.status}, ${input.position}, ${actor})
    ON CONFLICT (slug) DO NOTHING
    RETURNING slug
  `;
  if (!row) {
    return {
      ok: false,
      error:
        "Já existe um curso com esse endereço. Troque o nome ou o endereço.",
    };
  }
  await audit({
    actor,
    action: "course_created",
    details: { slug: input.slug, title: input.title, status: input.status },
  });
  return { ok: true };
}

/** O slug não muda: turmas, matrículas e certificados apontam para ele. */
export async function updateCourse(
  slug: string,
  input: CourseInput,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await findCourse(slug);
  if (!current) return { ok: false, error: "Curso não encontrado." };

  if (input.status !== "published" && current.status === "published") {
    const [open] = await db()`
      SELECT 1 FROM cohorts WHERE course_id = ${slug} AND status = 'open' LIMIT 1
    `;
    if (open) {
      return {
        ok: false,
        error:
          "Há turma aberta para este curso. Feche as vendas da turma antes de despublicar.",
      };
    }
  }

  const sql = db();
  await sql`
    UPDATE courses SET
      pillar = ${input.pillar}, title = ${input.title}, edition = ${input.edition},
      tagline = ${input.tagline}, lead = ${input.lead}, authors = ${input.authors},
      modules = ${sql.json(input.modules)}, materials = ${input.materials},
      software = ${input.software}, requirements = ${input.requirements},
      photo = ${input.photo}, status = ${input.status}, position = ${input.position}
    WHERE slug = ${slug}
  `;

  const changed = (Object.keys(input) as (keyof CourseInput)[]).filter(
    (key) =>
      key !== "slug" &&
      JSON.stringify(input[key]) !== JSON.stringify(current[key]),
  );
  await audit({
    actor,
    action: "course_updated",
    details: { slug, changed },
  });
  return { ok: true };
}

/** Só rascunho sem turma nenhuma pode ser apagado; o resto se arquiva. */
export async function deleteCourse(
  slug: string,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await db()<{ slug: string }[]>`
    DELETE FROM courses c
    WHERE c.slug = ${slug} AND c.status = 'draft'
      AND NOT EXISTS (SELECT 1 FROM cohorts t WHERE t.course_id = c.slug)
    RETURNING slug
  `;
  if (!row) {
    return {
      ok: false,
      error:
        "Só um rascunho sem turmas pode ser apagado. Use a situação “arquivado”.",
    };
  }
  await audit({ actor, action: "course_deleted", details: { slug } });
  return { ok: true };
}
