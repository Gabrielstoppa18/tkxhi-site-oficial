import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseBySlug } from "@/lib/courses";
import { formatBRL } from "@/lib/format";
import { auditTrail } from "@/lib/server/audit";
import { evidenceDossier } from "@/lib/server/email";
import { listManualReviews } from "@/lib/server/enrollments";
import { requireAdmin } from "@/lib/server/session";
import { approveRefundAction, denyRefundAction } from "../_actions/refunds";

/**
 * Pedidos que o sistema não decidiu sozinho. Cada um mostra o histórico
 * completo — ciência, pagamento, presença e auditoria — e duas saídas:
 * reembolsar (total ou parcial) ou negar com um motivo que vai para o aluno.
 */
export default async function RefundsPage({
  searchParams,
}: PageProps<"/admin/reembolsos">) {
  await requireAdmin("/admin/reembolsos");
  const query = await searchParams;
  const reviews = await listManualReviews();
  const dossiers = await Promise.all(
    reviews.map(async (item) =>
      evidenceDossier(
        item,
        courseBySlug(item.course_id),
        await auditTrail(item.id),
        { fullCpf: true },
      ),
    ),
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Reembolsos em análise
      </h1>

      {typeof query.ok === "string" ? (
        <p
          role="status"
          className="mt-4 border-l-2 border-primary pl-3 text-sm"
        >
          {query.ok === "aprovado"
            ? "Reembolso processado e aluno avisado por e-mail."
            : "Negativa registrada e aluno avisado por e-mail."}
        </p>
      ) : null}
      {typeof query.erro === "string" ? (
        <p
          role="alert"
          className="mt-4 border-l-2 border-destructive pl-3 text-sm text-destructive"
        >
          {query.erro}
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Nenhum pedido esperando decisão.
        </p>
      ) : null}

      <div className="mt-8 space-y-12">
        {reviews.map((item, index) => (
          <article key={item.id} className="border-t border-border pt-6">
            <h2 className="text-xl font-bold">{item.buyer_name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {courseBySlug(item.course_id)?.title ?? item.course_id} ·{" "}
              {formatBRL(item.amount_cents)} · motivo da análise:{" "}
              {item.refund_note}
            </p>

            <details className="mt-4">
              <summary className="inline-flex h-11 cursor-pointer items-center text-sm underline underline-offset-4">
                Histórico completo (ciência, presença, auditoria)
              </summary>
              <pre className="mt-2 overflow-x-auto bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {dossiers[index]}
              </pre>
            </details>

            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <form action={approveRefundAction} className="space-y-3">
                <input type="hidden" name="enrollmentId" value={item.id} />
                <Label htmlFor={`amount-${item.id}`}>Reembolsar (R$)</Label>
                <Input
                  id={`amount-${item.id}`}
                  name="amount"
                  inputMode="decimal"
                  defaultValue={(item.amount_cents / 100).toFixed(2)}
                  required
                  className="h-11 font-mono"
                />
                <Label htmlFor={`approve-note-${item.id}`}>
                  Observação interna (opcional)
                </Label>
                <Textarea id={`approve-note-${item.id}`} name="note" rows={2} />
                <Button type="submit" className="h-11 px-4">
                  Processar reembolso
                </Button>
              </form>

              <form action={denyRefundAction} className="space-y-3">
                <input type="hidden" name="enrollmentId" value={item.id} />
                <Label htmlFor={`deny-note-${item.id}`}>
                  Motivo da negativa (vai para o aluno)
                </Label>
                <Textarea
                  id={`deny-note-${item.id}`}
                  name="note"
                  rows={4}
                  required
                  minLength={10}
                  defaultValue={
                    item.attendance_confirmed
                      ? "Sua presença no curso foi registrada no check-in, e o conteúdo foi entregue integralmente, conforme as condições aceitas na matrícula."
                      : ""
                  }
                />
                <Button
                  type="submit"
                  variant="destructive"
                  className="h-11 px-4"
                >
                  Negar reembolso
                </Button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
