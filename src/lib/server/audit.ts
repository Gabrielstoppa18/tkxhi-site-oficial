import "server-only";
import type postgres from "postgres";
import { db } from "@/lib/server/db";

/**
 * Tudo o que muda o estado de uma matrícula passa por aqui. A tabela recusa
 * UPDATE e DELETE (ver db/schema.sql), então o histórico vale como evidência
 * numa contestação de chargeback.
 */
export type AuditAction =
  | "enrollment_created"
  | "enrollment_superseded"
  | "preference_created"
  | "webhook_received"
  | "webhook_rejected"
  | "payment_synced"
  | "payment_amount_mismatch"
  | "confirmation_email_sent"
  | "confirmation_email_failed"
  | "email_failed"
  | "chargeback_received"
  | "checkin_confirmed"
  | "checkin_undone"
  | "refund_link_requested"
  | "refund_requested"
  | "refund_auto_processed"
  | "refund_manual_review"
  | "refund_manual_approved"
  | "refund_denied"
  | "refund_failed"
  | "certificate_downloaded"
  | "certificate_email_sent"
  | "admin_login"
  | "admin_login_failed"
  | "admin_login_locked"
  | "admin_logout"
  | "admin_created"
  | "admin_reset"
  | "admin_enabled"
  | "admin_disabled"
  | "admin_setup_completed"
  | "course_created"
  | "course_updated"
  | "course_deleted"
  | "cohort_created"
  | "cohort_updated"
  | "cohort_deleted"
  | "rate_limited";

export type AuditEntry = {
  id: string;
  created_at: Date;
  actor: string;
  action: AuditAction;
  enrollment_id: string | null;
  ip: string | null;
  details: Record<string, unknown>;
};

export async function audit(entry: {
  actor: string;
  action: AuditAction;
  enrollmentId?: string | null;
  ip?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO audit_log (actor, action, enrollment_id, ip, details)
    VALUES (
      ${entry.actor},
      ${entry.action},
      ${entry.enrollmentId ?? null},
      ${entry.ip ?? null},
      ${sql.json((entry.details ?? {}) as postgres.JSONValue)}
    )
  `;
}

export async function auditTrail(enrollmentId: string): Promise<AuditEntry[]> {
  return db()<AuditEntry[]>`
    SELECT * FROM audit_log
    WHERE enrollment_id = ${enrollmentId}
    ORDER BY created_at, id
  `;
}

export async function recentAudit(limit = 200): Promise<AuditEntry[]> {
  return db()<AuditEntry[]>`
    SELECT * FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ${limit}
  `;
}

/** Matrículas, entre as informadas, cujo e-mail de confirmação já saiu. */
export async function confirmationsSent(
  enrollmentIds: string[],
): Promise<Set<string>> {
  if (enrollmentIds.length === 0) return new Set();
  const sql = db();
  const rows = await sql<{ enrollment_id: string }[]>`
    SELECT DISTINCT enrollment_id FROM audit_log
    WHERE action = 'confirmation_email_sent'
      AND enrollment_id IN ${sql(enrollmentIds)}
  `;
  return new Set(rows.map((row) => row.enrollment_id));
}
