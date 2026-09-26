import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { courseBySlug } from "@/lib/courses";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import { findEnrollment } from "@/lib/server/enrollments";
import { findCohort } from "@/lib/server/cohorts";
import { refundDecisionFor } from "@/lib/server/refunds";
import { readRefundToken } from "@/lib/server/tokens";
import { confirmRefundRequest } from "../actions";

export const metadata: Metadata = {
  title: "Sua matrícula",
  robots: { index: false, follow: false },
  // O token vai na URL: não pode vazar no Referer para outro site.
  referrer: "no-referrer",
};

const RESULT: Record<string, string> = {
  refunded:
    "Reembolso processado. Você recebe a confirmação por e-mail; o valor aparece conforme o prazo do meio de pagamento.",
  review:
    "Pedido recebido. Pelas condições da matrícula, este caso é analisado pela equipe — respondemos por e-mail em até 5 dias úteis.",
  already_requested: "Já existe um pedido de reembolso para esta matrícula.",
  not_eligible: "Esta matrícula não tem pagamento ativo para reembolsar.",
};

export default async function RefundRequestPage({
  params,
  searchParams,
}: PageProps<"/reembolso/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const enrollmentId = readRefundToken(token);
  if (!enrollmentId) redirect("/reembolso?expirado=1");

  const enrollment = await findEnrollment(enrollmentId);
  if (!enrollment) redirect("/reembolso?expirado=1");
  const course = courseBySlug(enrollment.course_id);

  // Prévia honesta do que vai acontecer — a decisão real é refeita no servidor
  // no momento do pedido.
  const cohort = await findCohort(enrollment.cohort_id);
  const preview =
    enrollment.payment_status === "approved"
      ? await refundDecisionFor(enrollment)
      : null;

  const result =
    typeof query.resultado === "string" ? RESULT[query.resultado] : null;
  const canRequest =
    enrollment.payment_status === "approved" && !enrollment.refund_requested_at;

  return (
    <main className="pillar-impressao-3d flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-xl px-6 py-20 sm:py-24">
        <p className="font-mono text-[0.7rem] tracking-[0.22em] text-primary uppercase">
          Sua matrícula
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance">
          {course?.title ?? enrollment.course_id}
        </h1>

        <dl className="mt-8 grid gap-4 border-y border-border py-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Aluno</dt>
            <dd className="mt-1 text-base">{enrollment.buyer_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Valor pago</dt>
            <dd className="mt-1 text-base">
              {formatBRL(enrollment.amount_cents)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pago em</dt>
            <dd className="mt-1 text-base">
              {enrollment.paid_at ? formatDateTime(enrollment.paid_at) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Turma</dt>
            <dd className="mt-1 text-base first-letter:uppercase">
              {cohort ? formatDate(cohort.startsAt) : "a definir"}
            </dd>
          </div>
        </dl>

        {result ? (
          <p
            role="status"
            className="mt-8 border-l-2 border-primary pl-5 text-lg text-pretty"
          >
            {result}
          </p>
        ) : canRequest && preview ? (
          <form action={confirmRefundRequest} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <p className="text-lg text-pretty">
              {preview.kind === "auto"
                ? `Pelas condições da matrícula, você recebe ${formatBRL(preview.amountCents)} de volta assim que confirmar.`
                : "Pelas condições da matrícula, este pedido será analisado pela equipe antes de qualquer reembolso."}
            </p>
            <Button type="submit" size="lg" className="mt-6 h-11 px-5">
              Confirmar pedido de reembolso
            </Button>
            {preview.kind === "auto" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Ao confirmar, sua vaga é liberada.
              </p>
            ) : null}
          </form>
        ) : (
          <p className="mt-8 text-lg text-pretty text-muted-foreground">
            {enrollment.refund_requested_at
              ? `Pedido de reembolso feito em ${formatDateTime(enrollment.refund_requested_at)}.`
              : RESULT.not_eligible}
          </p>
        )}

        <Link
          href="/reembolso"
          className="mt-10 inline-flex h-11 items-center text-sm text-muted-foreground underline underline-offset-4"
        >
          Outra matrícula
        </Link>
      </div>
    </main>
  );
}
