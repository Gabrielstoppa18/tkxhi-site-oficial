import "server-only";
import { revalidatePath } from "next/cache";
import { courseBySlug, courseHref } from "@/lib/courses";
import { decideRefund, type RefundDecision } from "@/lib/refund-policy";
import { audit, auditTrail } from "@/lib/server/audit";
import { findCohort } from "@/lib/server/cohorts";
import { db } from "@/lib/server/db";
import { sendAdminAlert, sendRefundOutcome } from "@/lib/server/email";
import type { Enrollment } from "@/lib/server/enrollments";
import { MercadoPagoError, refundPayment } from "@/lib/server/mercadopago";

export type RefundRequestResult =
  | { kind: "refunded"; amountCents: number }
  | { kind: "review" }
  | { kind: "already_requested"; enrollment: Enrollment }
  | { kind: "not_eligible" };

/**
 * Decisão para uma matrícula agora: data da turma atual (se foi remarcada,
 * vale a nova) e política congelada na compra (a que o aluno aceitou).
 */
export async function refundDecisionFor(
  enrollment: Enrollment,
): Promise<RefundDecision> {
  const cohort = await findCohort(enrollment.cohort_id);
  return decideRefund({
    paidAt: enrollment.paid_at ?? enrollment.created_at,
    now: new Date(),
    attended: enrollment.attendance_confirmed,
    classStartsAt: cohort ? new Date(cohort.startsAt) : null,
    amountCents: enrollment.amount_cents,
    policy: {
      latePercent: enrollment.late_refund_percent,
      untilDaysBefore: enrollment.late_refund_days_before,
    },
  });
}

/** Reembolso concedido libera a vaga: a página do curso volta a mostrá-la. */
function releaseSeat(courseId: string) {
  const course = courseBySlug(courseId);
  if (course) revalidatePath(courseHref(course));
}

function describeError(error: unknown): string {
  if (error instanceof MercadoPagoError) {
    return `${error.message} ${JSON.stringify(error.body)}`.slice(0, 500);
  }
  return error instanceof Error ? error.message : String(error);
}

async function sendToReview(
  enrollment: Enrollment,
  reason: string,
  intro: string,
): Promise<void> {
  const [updated] = await db()<Enrollment[]>`
    UPDATE enrollments SET refund_status = 'manual_review', refund_note = ${reason}
    WHERE id = ${enrollment.id}
    RETURNING *
  `;
  await audit({
    actor: "sistema",
    action: "refund_manual_review",
    enrollmentId: enrollment.id,
    details: { reason },
  });
  const course = courseBySlug(enrollment.course_id);
  await sendAdminAlert({
    subject: `Reembolso para analisar — ${enrollment.buyer_name}`,
    intro,
    enrollment: updated,
    course,
    trail: await auditTrail(enrollment.id),
  });
  await sendRefundOutcome(updated, course, { kind: "review" });
}

/**
 * Pedido de reembolso feito pelo aluno. O UPDATE inicial é a trava: só um
 * pedido por matrícula passa, mesmo com dois cliques ou duas abas.
 */
export async function requestRefund(
  enrollmentId: string,
  ip: string,
): Promise<RefundRequestResult> {
  const [locked] = await db()<Enrollment[]>`
    UPDATE enrollments SET refund_requested_at = now()
    WHERE id = ${enrollmentId}
      AND refund_requested_at IS NULL
      AND payment_status = 'approved'
      AND mp_payment_id IS NOT NULL
    RETURNING *
  `;

  if (!locked) {
    const [current] = await db()<Enrollment[]>`
      SELECT * FROM enrollments WHERE id = ${enrollmentId}
    `;
    return current?.refund_requested_at
      ? { kind: "already_requested", enrollment: current }
      : { kind: "not_eligible" };
  }

  const course = courseBySlug(locked.course_id);
  const decision = await refundDecisionFor(locked);

  await audit({
    actor: "aluno",
    action: "refund_requested",
    enrollmentId: locked.id,
    ip,
    details: {
      decision: decision.kind,
      rule: decision.rule,
      attended: locked.attendance_confirmed,
      attendanceTimestamp: locked.attendance_timestamp,
    },
  });

  if (decision.kind === "manual") {
    await sendToReview(
      locked,
      decision.rule,
      `Pedido de reembolso que o sistema não aprova sozinho (${decision.rule}). A decisão é de vocês: negar citando a prestação do serviço, reembolsar parte ou tudo.`,
    );
    return { kind: "review" };
  }

  const full = decision.amountCents >= locked.amount_cents;
  try {
    const refund = await refundPayment(
      locked.mp_payment_id!,
      `refund-${locked.id}`,
      full ? undefined : decision.amountCents,
    );
    const [updated] = await db()<Enrollment[]>`
      UPDATE enrollments SET
        refund_status = 'auto_approved',
        refund_amount_cents = ${decision.amountCents},
        refund_decided_at = now(),
        refund_decided_by = 'sistema',
        refund_note = ${decision.rule},
        mp_refund_id = ${String(refund.id)},
        payment_status = ${full ? "refunded" : "approved"}
      WHERE id = ${locked.id}
      RETURNING *
    `;
    releaseSeat(locked.course_id);
    await audit({
      actor: "sistema",
      action: "refund_auto_processed",
      enrollmentId: locked.id,
      details: {
        amountCents: decision.amountCents,
        refundId: refund.id,
        rule: decision.rule,
      },
    });
    await sendRefundOutcome(updated, course, {
      kind: "refunded",
      amountCents: decision.amountCents,
    });
    return { kind: "refunded", amountCents: decision.amountCents };
  } catch (error) {
    const message = describeError(error);
    console.error("Falha no reembolso automático", locked.id, message);
    await audit({
      actor: "sistema",
      action: "refund_failed",
      enrollmentId: locked.id,
      details: { error: message, amountCents: decision.amountCents },
    });
    await sendToReview(
      locked,
      `reembolso automático falhou: ${message}`,
      `O reembolso automático (${decision.rule}) falhou no Mercado Pago. O aluno tem direito a ele — processem manualmente pelo painel.`,
    );
    return { kind: "review" };
  }
}

/** Reembolso decidido por uma pessoa, total ou parcial. */
export async function approveManualRefund(
  enrollmentId: string,
  actor: string,
  amountCents: number,
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [locked] = await db()<Enrollment[]>`
    UPDATE enrollments SET
      refund_status = 'approved',
      refund_decided_at = now(),
      refund_decided_by = ${actor}
    WHERE id = ${enrollmentId}
      AND refund_status = 'manual_review'
      AND mp_payment_id IS NOT NULL
      AND ${amountCents} > 0
      AND ${amountCents} <= amount_cents
    RETURNING *
  `;
  if (!locked) {
    return { ok: false, error: "Matrícula fora de análise ou valor inválido." };
  }

  const full = amountCents >= locked.amount_cents;
  try {
    const refund = await refundPayment(
      locked.mp_payment_id!,
      `refund-${locked.id}-manual-${amountCents}`,
      full ? undefined : amountCents,
    );
    const [updated] = await db()<Enrollment[]>`
      UPDATE enrollments SET
        refund_amount_cents = ${amountCents},
        refund_note = ${note || null},
        mp_refund_id = ${String(refund.id)},
        payment_status = ${full ? "refunded" : "approved"}
      WHERE id = ${locked.id}
      RETURNING *
    `;
    releaseSeat(locked.course_id);
    await audit({
      actor,
      action: "refund_manual_approved",
      enrollmentId: locked.id,
      details: { amountCents, refundId: refund.id, note },
    });
    await sendRefundOutcome(updated, courseBySlug(updated.course_id), {
      kind: "refunded",
      amountCents,
    });
    return { ok: true };
  } catch (error) {
    const message = describeError(error);
    await db()`
      UPDATE enrollments SET refund_status = 'manual_review', refund_decided_at = NULL, refund_decided_by = NULL
      WHERE id = ${locked.id}
    `;
    await audit({
      actor,
      action: "refund_failed",
      enrollmentId: locked.id,
      details: { error: message, amountCents },
    });
    return { ok: false, error: `O Mercado Pago recusou: ${message}` };
  }
}

export async function denyRefund(
  enrollmentId: string,
  actor: string,
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [updated] = await db()<Enrollment[]>`
    UPDATE enrollments SET
      refund_status = 'denied',
      refund_decided_at = now(),
      refund_decided_by = ${actor},
      refund_note = ${note}
    WHERE id = ${enrollmentId} AND refund_status = 'manual_review'
    RETURNING *
  `;
  if (!updated) return { ok: false, error: "Matrícula fora de análise." };

  await audit({
    actor,
    action: "refund_denied",
    enrollmentId,
    details: { note },
  });
  await sendRefundOutcome(updated, courseBySlug(updated.course_id), {
    kind: "denied",
    note,
  });
  return { ok: true };
}
