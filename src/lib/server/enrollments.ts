import "server-only";
import { decrypt } from "@/lib/server/crypto";
import { db } from "@/lib/server/db";

export type PaymentStatus = "pending" | "approved" | "refunded" | "cancelled";
export type RefundStatus =
  "none" | "auto_approved" | "manual_review" | "denied" | "approved";

export type Enrollment = {
  id: string;
  course_id: string;
  cohort_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_cpf_enc: string;
  amount_cents: number;
  late_refund_percent: number;
  late_refund_days_before: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  payment_status: PaymentStatus;
  paid_at: Date | null;
  consent_text: string;
  consent_version: string;
  consent_timestamp: Date;
  consent_ip: string;
  consent_user_agent: string | null;
  checkin_token: string;
  certificate_token: string;
  attendance_confirmed: boolean;
  attendance_timestamp: Date | null;
  attendance_by: string | null;
  refund_requested_at: Date | null;
  refund_status: RefundStatus;
  refund_amount_cents: number | null;
  refund_decided_at: Date | null;
  refund_decided_by: string | null;
  refund_note: string | null;
  mp_refund_id: string | null;
  created_at: Date;
  updated_at: Date;
};

/** Tempo que uma matrícula pendente segura a vaga — o mesmo da validade da preferência. */
export const PENDING_HOLD_MINUTES = 30;

/** CPF em texto puro, só para exibir no painel. No banco ele fica cifrado. */
export function buyerCpf(
  enrollment: Pick<Enrollment, "buyer_cpf_enc">,
): string {
  return decrypt(enrollment.buyer_cpf_enc, "cpf");
}

export async function findEnrollment(id: string): Promise<Enrollment | null> {
  if (!isUuid(id)) return null;
  const [row] = await db()<Enrollment[]>`
    SELECT * FROM enrollments WHERE id = ${id}
  `;
  return row ?? null;
}

export async function findByCheckinToken(
  token: string,
): Promise<Enrollment | null> {
  const [row] = await db()<Enrollment[]>`
    SELECT * FROM enrollments WHERE checkin_token = ${token}
  `;
  return row ?? null;
}

export async function findByCertificateToken(
  token: string,
): Promise<Enrollment | null> {
  const [row] = await db()<Enrollment[]>`
    SELECT * FROM enrollments WHERE certificate_token = ${token}
  `;
  return row ?? null;
}

/** Matrículas pagas (ou já reembolsadas) de um e-mail, para o link de reembolso. */
export async function findPaidByEmail(email: string): Promise<Enrollment[]> {
  return db()<Enrollment[]>`
    SELECT * FROM enrollments
    WHERE lower(buyer_email) = ${email.toLowerCase()}
      AND payment_status IN ('approved', 'refunded')
    ORDER BY created_at DESC
  `;
}

export async function listCohortEnrollments(
  cohortId: string,
): Promise<Enrollment[]> {
  return db()<Enrollment[]>`
    SELECT * FROM enrollments
    WHERE cohort_id = ${cohortId} AND payment_status <> 'cancelled'
    ORDER BY buyer_name
  `;
}

export async function listManualReviews(): Promise<Enrollment[]> {
  return db()<Enrollment[]>`
    SELECT * FROM enrollments
    WHERE refund_status = 'manual_review'
    ORDER BY refund_requested_at
  `;
}

/** Vagas ocupadas: pagas ativas + pendentes ainda dentro da janela de pagamento. */
export async function seatsTaken(cohortId: string): Promise<number> {
  const [row] = await db()<{ count: number }[]>`
    SELECT count(*)::int AS count FROM enrollments
    WHERE cohort_id = ${cohortId}
      AND (
        (payment_status = 'approved' AND refund_status NOT IN ('auto_approved', 'approved'))
        OR (
          payment_status = 'pending'
          AND created_at > now() - make_interval(mins => ${PENDING_HOLD_MINUTES})
        )
      )
  `;
  return row.count;
}

export async function hasApprovedEnrollment(
  cohortId: string,
  email: string,
): Promise<boolean> {
  const [row] = await db()`
    SELECT 1 FROM enrollments
    WHERE cohort_id = ${cohortId}
      AND lower(buyer_email) = ${email.toLowerCase()}
      AND payment_status = 'approved'
      AND refund_status NOT IN ('auto_approved', 'approved')
    LIMIT 1
  `;
  return Boolean(row);
}

/** Matrícula ativa: paga e sem reembolso concedido (nem parcial). */
export function isActive(enrollment: Enrollment): boolean {
  return (
    enrollment.payment_status === "approved" &&
    enrollment.refund_status !== "auto_approved" &&
    enrollment.refund_status !== "approved"
  );
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
