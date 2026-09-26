import "server-only";
import { revalidatePath } from "next/cache";
import { courseBySlug, courseHref } from "@/lib/courses";
import { audit, auditTrail } from "@/lib/server/audit";
import { findCohort } from "@/lib/server/cohorts";
import { db } from "@/lib/server/db";
import { sendAdminAlert, sendEnrollmentConfirmation } from "@/lib/server/email";
import {
  findEnrollment,
  type Enrollment,
  type PaymentStatus,
} from "@/lib/server/enrollments";
import { getPayment, type Payment } from "@/lib/server/mercadopago";

function mapStatus(status: Payment["status"]): PaymentStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "rejected":
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

/**
 * Busca o pagamento na API do Mercado Pago e aplica o estado na matrícula.
 * Nunca usa o conteúdo da notificação: só o id, para consultar a fonte.
 *
 * Idempotente — o Mercado Pago repete notificações e a página de retorno pode
 * chamar isto de novo. O e-mail de confirmação sai só na transição para
 * `approved`, que o UPDATE condicional garante acontecer uma vez.
 */
export async function syncPayment(
  paymentId: string,
  actor: "webhook" | "sistema",
): Promise<Enrollment | null> {
  const payment = await getPayment(paymentId);
  const enrollment = payment.external_reference
    ? await findEnrollment(payment.external_reference)
    : null;

  if (!enrollment) {
    await audit({
      actor,
      action: "payment_synced",
      details: {
        paymentId,
        status: payment.status,
        externalReference: payment.external_reference,
        result: "matrícula não encontrada",
      },
    });
    return null;
  }

  const paidCents = Math.round(payment.transaction_amount * 100);
  if (
    payment.status === "approved" &&
    (paidCents !== enrollment.amount_cents || payment.currency_id !== "BRL")
  ) {
    await audit({
      actor,
      action: "payment_amount_mismatch",
      enrollmentId: enrollment.id,
      details: {
        paymentId,
        expectedCents: enrollment.amount_cents,
        paidCents,
        currency: payment.currency_id,
      },
    });
    return enrollment;
  }

  const next = mapStatus(payment.status);

  // Transições permitidas: qualquer coisa enquanto não aprovada; depois de
  // aprovada, só para reembolsada. Um pagamento recusado numa segunda
  // tentativa não desfaz um aprovado.
  const [updated] = await db()<
    (Enrollment & { previous_status: PaymentStatus })[]
  >`
    WITH previous AS (
      SELECT payment_status FROM enrollments WHERE id = ${enrollment.id} FOR UPDATE
    )
    UPDATE enrollments SET
      payment_status = ${next},
      mp_payment_id = ${String(payment.id)},
      paid_at = COALESCE(paid_at, ${payment.date_approved ? new Date(payment.date_approved) : null})
    WHERE id = ${enrollment.id}
      AND (
        payment_status IN ('pending', 'cancelled')
        OR (payment_status = 'approved' AND ${next} = 'refunded')
      )
    RETURNING enrollments.*, (SELECT payment_status FROM previous) AS previous_status
  `;

  await audit({
    actor,
    action: "payment_synced",
    enrollmentId: enrollment.id,
    details: {
      paymentId,
      mpStatus: payment.status,
      mpStatusDetail: payment.status_detail,
      from: enrollment.payment_status,
      to: updated ? next : enrollment.payment_status,
    },
  });

  const course = courseBySlug(enrollment.course_id);

  // Fora do UPDATE: um chargeback sobre uma matrícula já reembolsada também
  // precisa chegar a quem vai se defender.
  if (payment.status === "charged_back") {
    const current = updated ?? enrollment;
    await audit({
      actor,
      action: "chargeback_received",
      enrollmentId: current.id,
      details: { paymentId, statusDetail: payment.status_detail },
    });
    await sendAdminAlert({
      subject: `Chargeback aberto — ${current.buyer_name}`,
      intro:
        "O aluno contestou a compra no cartão. Abaixo está o histórico completo da matrícula para anexar na defesa, dentro do prazo indicado pelo Mercado Pago.",
      enrollment: current,
      course,
      trail: await auditTrail(current.id),
    });
  }

  if (!updated) return enrollment;

  // A vaga mudou de dono: a página do curso precisa mostrar "esgotada" logo.
  if (course && updated.previous_status !== next) {
    revalidatePath(courseHref(course));
  }

  const cohort = await findCohort(updated.cohort_id);
  if (
    updated.previous_status !== "approved" &&
    next === "approved" &&
    course &&
    cohort
  ) {
    await sendEnrollmentConfirmation(updated, course, cohort);
    await audit({
      actor: "sistema",
      action: "confirmation_email_sent",
      enrollmentId: updated.id,
      details: { to: updated.buyer_email },
    });
  }

  return updated;
}
