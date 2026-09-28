import "server-only";
import { type Cohort, type CohortStatus } from "@/lib/courses";
import { findCourse } from "@/lib/server/courses";
import { audit } from "@/lib/server/audit";
import { db } from "@/lib/server/db";
import { PENDING_HOLD_MINUTES } from "@/lib/server/enrollments";

type CohortRow = {
  id: string;
  course_id: string;
  label: string | null;
  starts_at: Date;
  ends_at: Date;
  venue: string;
  address: string;
  price_cents: number;
  capacity: number;
  late_refund_percent: number;
  late_refund_days_before: number;
  status: CohortStatus;
};

export type CohortWithSeats = Cohort & {
  /** Pagas e ativas (sem reembolso concedido). */
  paid: number;
  /** Pagas + pendentes dentro da janela de pagamento. */
  taken: number;
};

function toCohort(row: CohortRow): Cohort {
  return {
    id: row.id,
    courseId: row.course_id,
    label: row.label,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    venue: row.venue,
    address: row.address,
    priceCents: row.price_cents,
    capacity: row.capacity,
    lateRefundPercent: row.late_refund_percent,
    lateRefundDaysBefore: row.late_refund_days_before,
    status: row.status,
  };
}

const SEATS = (cohortAlias: string) => `
  (SELECT count(*)::int FROM enrollments e
    WHERE e.cohort_id = ${cohortAlias}.id
      AND e.payment_status = 'approved'
      AND e.refund_status NOT IN ('auto_approved', 'approved')) AS paid,
  (SELECT count(*)::int FROM enrollments e
    WHERE e.cohort_id = ${cohortAlias}.id
      AND ((e.payment_status = 'approved' AND e.refund_status NOT IN ('auto_approved', 'approved'))
        OR (e.payment_status = 'pending' AND e.created_at > now() - make_interval(mins => ${PENDING_HOLD_MINUTES})))) AS taken`;

type Row = CohortRow & { paid: number; taken: number };
const withSeats = (row: Row): CohortWithSeats => ({
  ...toCohort(row),
  paid: row.paid,
  taken: row.taken,
});

export async function findCohort(id: string): Promise<CohortWithSeats | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sql = db();
  const [row] = await sql<Row[]>`
    SELECT c.*, ${sql.unsafe(SEATS("c"))} FROM cohorts c WHERE c.id = ${id}
  `;
  return row ? withSeats(row) : null;
}

export async function listCohorts(): Promise<CohortWithSeats[]> {
  const sql = db();
  const rows = await sql<Row[]>`
    SELECT c.*, ${sql.unsafe(SEATS("c"))} FROM cohorts c
    ORDER BY c.starts_at DESC
  `;
  return rows.map(withSeats);
}

/** Turmas à venda: abertas e ainda não começadas, da mais próxima para a mais distante. */
export async function listOpenCohorts(
  courseId: string,
): Promise<CohortWithSeats[]> {
  const sql = db();
  const rows = await sql<Row[]>`
    SELECT c.*, ${sql.unsafe(SEATS("c"))} FROM cohorts c
    WHERE c.course_id = ${courseId} AND c.status = 'open' AND c.starts_at > now()
    ORDER BY c.starts_at
  `;
  return rows.map(withSeats);
}

/**
 * Formulário de turma → valores validados. Datas chegam como dia + hora no
 * horário de Brasília (UTC−3, sem horário de verão desde 2019).
 */
export type CohortInput = Omit<Cohort, "id">;

export async function parseCohortForm(
  form: FormData,
): Promise<{ ok: true; value: CohortInput } | { ok: false; error: string }> {
  const text = (name: string, max = 200) =>
    String(form.get(name) ?? "")
      .trim()
      .slice(0, max);
  const int = (name: string) => {
    const raw = text(name, 12).replace(",", ".");
    return raw === "" ? NaN : Number(raw);
  };

  const courseId = text("courseId", 80);
  if (!(await findCourse(courseId))) {
    return { ok: false, error: "Curso inválido." };
  }

  const date = text("date", 10);
  const start = text("startTime", 5);
  const end = text("endTime", 5);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(start) ||
    !/^\d{2}:\d{2}$/.test(end)
  ) {
    return {
      ok: false,
      error: "Informe data, hora de início e hora de término.",
    };
  }
  const startsAt = new Date(`${date}T${start}:00-03:00`);
  const endsAt = new Date(`${date}T${end}:00-03:00`);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { ok: false, error: "Data ou horário inválido." };
  }
  if (endsAt <= startsAt)
    return { ok: false, error: "O término precisa ser depois do início." };

  const venue = text("venue", 120);
  const address = text("address", 240);
  if (venue.length < 2 || address.length < 5) {
    return { ok: false, error: "Informe o local e o endereço completo." };
  }

  const price = int("price");
  const priceCents = Math.round(price * 100);
  if (!Number.isFinite(price) || priceCents < 100 || priceCents > 10_000_00) {
    return { ok: false, error: "Preço entre R$ 1,00 e R$ 10.000,00." };
  }
  const capacity = int("capacity");
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
    return { ok: false, error: "Vagas: um número inteiro entre 1 e 500." };
  }
  const lateRefundPercent = int("lateRefundPercent");
  if (
    !Number.isInteger(lateRefundPercent) ||
    lateRefundPercent < 0 ||
    lateRefundPercent > 100
  ) {
    return { ok: false, error: "Reembolso fora dos 7 dias: de 0 a 100%." };
  }
  const lateRefundDaysBefore = int("lateRefundDaysBefore");
  if (
    !Number.isInteger(lateRefundDaysBefore) ||
    lateRefundDaysBefore < 0 ||
    lateRefundDaysBefore > 90
  ) {
    return { ok: false, error: "Antecedência mínima: de 0 a 90 dias." };
  }

  const status = text("status", 12) as CohortStatus;
  if (!["draft", "open", "closed", "cancelled"].includes(status)) {
    return { ok: false, error: "Situação inválida." };
  }

  return {
    ok: true,
    value: {
      courseId,
      label: text("label", 80) || null,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      venue,
      address,
      priceCents,
      capacity,
      lateRefundPercent,
      lateRefundDaysBefore,
      status,
    },
  };
}

export async function createCohort(
  input: CohortInput,
  actor: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.status === "cancelled") {
    return { ok: false, error: "Uma turma nova não pode nascer cancelada." };
  }
  if (input.status === "open" && Date.parse(input.startsAt) <= Date.now()) {
    return {
      ok: false,
      error: "Não dá para abrir vendas de uma turma que já começou.",
    };
  }
  const [row] = await db()<{ id: string }[]>`
    INSERT INTO cohorts (course_id, label, starts_at, ends_at, venue, address, price_cents,
      capacity, late_refund_percent, late_refund_days_before, status, created_by)
    VALUES (${input.courseId}, ${input.label}, ${new Date(input.startsAt)}, ${new Date(input.endsAt)},
      ${input.venue}, ${input.address}, ${input.priceCents}, ${input.capacity},
      ${input.lateRefundPercent}, ${input.lateRefundDaysBefore}, ${input.status}, ${actor})
    RETURNING id
  `;
  await audit({
    actor,
    action: "cohort_created",
    details: { cohortId: row.id, ...input },
  });
  return { ok: true, id: row.id };
}

/**
 * Edita uma turma. Matrículas já feitas guardam preço e política do momento
 * da compra — mudar aqui só vale para as próximas. Regras:
 * - vagas não podem ficar abaixo das matrículas pagas;
 * - o curso de uma turma com matrículas não muda;
 * - cancelar exige que não haja matrícula ativa (reembolse antes).
 */
export async function updateCohort(
  id: string,
  input: CohortInput,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await findCohort(id);
  if (!current) return { ok: false, error: "Turma não encontrada." };

  if (input.capacity < current.paid) {
    return {
      ok: false,
      error: `Já há ${current.paid} matrícula(s) paga(s): as vagas não podem ficar abaixo disso.`,
    };
  }
  if (input.courseId !== current.courseId && current.taken > 0) {
    return {
      ok: false,
      error: "Esta turma já tem matrículas: o curso não pode mudar.",
    };
  }
  if (input.status === "cancelled" && current.paid > 0) {
    return {
      ok: false,
      error:
        "Há alunos pagos. Reembolse todos antes de cancelar, ou feche as vendas.",
    };
  }
  if (input.status === "open" && Date.parse(input.startsAt) <= Date.now()) {
    return {
      ok: false,
      error: "Não dá para abrir vendas de uma turma que já começou.",
    };
  }

  await db()`
    UPDATE cohorts SET
      course_id = ${input.courseId}, label = ${input.label},
      starts_at = ${new Date(input.startsAt)}, ends_at = ${new Date(input.endsAt)},
      venue = ${input.venue}, address = ${input.address},
      price_cents = ${input.priceCents}, capacity = ${input.capacity},
      late_refund_percent = ${input.lateRefundPercent},
      late_refund_days_before = ${input.lateRefundDaysBefore},
      status = ${input.status}
    WHERE id = ${id}
  `;

  const changes = Object.fromEntries(
    (Object.keys(input) as (keyof CohortInput)[])
      .filter((key) => input[key] !== current[key])
      .map((key) => [key, { de: current[key], para: input[key] }]),
  );
  await audit({
    actor,
    action: "cohort_updated",
    details: { cohortId: id, changes },
  });
  return { ok: true };
}

/** Só rascunho sem nenhuma matrícula (nem pendente) pode ser apagado. */
export async function deleteCohort(
  id: string,
  actor: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [row] = await db()<{ id: string }[]>`
    DELETE FROM cohorts c
    WHERE c.id = ${id} AND c.status = 'draft'
      AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.cohort_id = c.id)
    RETURNING id
  `;
  if (!row) {
    return {
      ok: false,
      error:
        "Só um rascunho sem matrículas pode ser apagado. Feche ou cancele a turma.",
    };
  }
  await audit({ actor, action: "cohort_deleted", details: { cohortId: id } });
  return { ok: true };
}

/**
 * Turmas à venda para a página pública. Nunca derruba a página: sem banco (no
 * build, por exemplo) devolve lista vazia e a página mostra "em breve" até a
 * próxima revalidação.
 */
export async function publicCohorts(
  courseId: string,
): Promise<CohortWithSeats[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await listOpenCohorts(courseId);
  } catch (error) {
    console.warn(
      "Turmas indisponíveis",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/** Turma sugerida no check-in: a mais próxima que ainda não terminou, senão a mais recente. */
export function currentCohort<T extends Cohort>(cohorts: T[]): T | undefined {
  const now = Date.now();
  const upcoming = cohorts
    .filter((item) => Date.parse(item.endsAt) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return (
    upcoming[0] ??
    [...cohorts].sort(
      (a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt),
    )[0]
  );
}

/**
 * Próxima turma aberta de cada curso, para catálogo e destaques. Tolerante
 * como publicCohorts: sem banco, devolve mapa vazio.
 */
export async function nextOpenCohorts(): Promise<Map<string, CohortWithSeats>> {
  if (!process.env.DATABASE_URL) return new Map();
  try {
    const sql = db();
    const rows = await sql<Row[]>`
      SELECT DISTINCT ON (c.course_id) c.*, ${sql.unsafe(SEATS("c"))}
      FROM cohorts c
      WHERE c.status = 'open' AND c.starts_at > now()
      ORDER BY c.course_id, c.starts_at
    `;
    return new Map(rows.map((row) => [row.course_id, withSeats(row)]));
  } catch (error) {
    console.warn(
      "Turmas indisponíveis",
      error instanceof Error ? error.message : error,
    );
    return new Map();
  }
}
