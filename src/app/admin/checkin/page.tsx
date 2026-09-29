import Link from "next/link";
import { Award, Check, MailWarning, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseTitles, findCourse } from "@/lib/server/courses";
import { formatCpf, formatDate, formatTime } from "@/lib/format";
import { confirmationsSent } from "@/lib/server/audit";
import { currentCohort, findCohort, listCohorts } from "@/lib/server/cohorts";
import {
  buyerCpf,
  isActive,
  listCohortEnrollments,
} from "@/lib/server/enrollments";
import { requireAdmin } from "@/lib/server/session";
import {
  confirmCheckin,
  resendConfirmation,
  sendCertificates,
  undoCheckin,
} from "../_actions/checkin";

/**
 * Lista da turma para o dia do curso. Quem não tiver o QR à mão é marcado
 * aqui; quem tiver, o celular abre /admin/checkin/[token] ao escanear.
 */
export default async function CheckinPage({
  searchParams,
}: PageProps<"/admin/checkin">) {
  await requireAdmin("/admin/checkin");
  const titles = await courseTitles();
  const query = await searchParams;
  const cohorts = (await listCohorts()).filter(
    (item) => item.status !== "draft",
  );

  const chosen =
    (typeof query.turma === "string" && (await findCohort(query.turma))) ||
    currentCohort(cohorts);

  if (!chosen) {
    return (
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Check-in
        </h1>
        <p className="mt-4 text-muted-foreground">
          Nenhuma turma publicada ainda.{" "}
          <Link href="/admin/turmas" className="underline underline-offset-4">
            Criar uma turma
          </Link>
          .
        </p>
      </div>
    );
  }

  const course = await findCourse(chosen.courseId);
  const enrollments = await listCohortEnrollments(chosen.id);
  const paid = enrollments.filter(isActive);
  const present = paid.filter((item) => item.attendance_confirmed);
  const confirmed = await confirmationsSent(paid.map((item) => item.id));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Check-in · {course?.title ?? chosen.courseId}
      </h1>
      <p className="mt-1 text-muted-foreground first-letter:uppercase">
        {chosen.label ? `${chosen.label} · ` : ""}
        {formatDate(chosen.startsAt)}, {formatTime(chosen.startsAt)} ·{" "}
        {chosen.venue}
      </p>

      {cohorts.length > 1 ? (
        <form className="mt-4 flex flex-wrap items-end gap-2" method="get">
          <label className="text-sm">
            <span className="block text-muted-foreground">Outra turma</span>
            <select
              name="turma"
              defaultValue={chosen.id}
              className="mt-1 h-11 border border-input bg-background px-3"
            >
              {cohorts.map((item) => (
                <option key={item.id} value={item.id}>
                  {formatDate(item.startsAt)} ·{" "}
                  {titles.get(item.courseId) ?? item.courseId}
                  {item.label ? ` · ${item.label}` : ""}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="outline" className="h-11">
            Abrir
          </Button>
        </form>
      ) : null}

      <p className="mt-6 font-mono text-sm text-muted-foreground">
        {present.length} de {paid.length} presentes
      </p>

      {typeof query.certificados === "string" ? (
        <p
          role="status"
          className="mt-4 border-l-2 border-primary pl-3 text-sm"
        >
          Certificado enviado para {query.certificados} aluno(s).
          {query.falhas && query.falhas !== "0"
            ? ` ${query.falhas} não saiu — veja a auditoria.`
            : ""}
        </p>
      ) : null}

      {typeof query.confirmacao === "string" ? (
        <p
          role={query.confirmacao === "ok" ? "status" : "alert"}
          className={
            query.confirmacao === "ok"
              ? "mt-4 border-l-2 border-primary pl-3 text-sm"
              : "mt-4 border-l-2 border-destructive pl-3 text-sm text-destructive"
          }
        >
          {query.confirmacao === "ok"
            ? "E-mail de confirmação reenviado."
            : "O e-mail não saiu. Veja o motivo em Auditoria (confirmation_email_failed)."}
        </p>
      ) : null}

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {enrollments.length === 0 ? (
          <li className="py-6 text-muted-foreground">
            Nenhuma matrícula nesta turma ainda.
          </li>
        ) : null}
        {enrollments.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.buyer_name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {item.buyer_email} · {formatCpf(buyerCpf(item))}
              </p>
              {isActive(item) ? (
                <form
                  action={resendConfirmation}
                  className="mt-1 flex items-center gap-2 text-xs"
                >
                  <input type="hidden" name="enrollmentId" value={item.id} />
                  {confirmed.has(item.id) ? null : (
                    <span className="flex items-center gap-1 text-destructive">
                      <MailWarning aria-hidden className="size-3.5" />
                      Confirmação não enviada
                    </span>
                  )}
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center gap-1 text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Send aria-hidden className="size-3.5" />
                    {confirmed.has(item.id)
                      ? "Reenviar confirmação"
                      : "Enviar confirmação"}
                  </button>
                </form>
              ) : null}
            </div>
            {!isActive(item) ? (
              <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                {item.payment_status === "pending"
                  ? "pagamento pendente"
                  : "reembolsado"}
              </span>
            ) : item.attendance_confirmed ? (
              <form action={undoCheckin} className="flex items-center gap-3">
                <input type="hidden" name="enrollmentId" value={item.id} />
                <span className="flex items-center gap-1 text-sm text-primary">
                  <Check aria-hidden className="size-4" />
                  Presente às {formatTime(item.attendance_timestamp!)}
                </span>
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-11"
                  aria-label={`Desfazer check-in de ${item.buyer_name}`}
                >
                  <Undo2 aria-hidden />
                </Button>
              </form>
            ) : (
              <form action={confirmCheckin}>
                <input type="hidden" name="enrollmentId" value={item.id} />
                <Button type="submit" className="h-11 px-4">
                  Marcar presença
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form action={sendCertificates} className="mt-10">
        <input type="hidden" name="cohortId" value={chosen.id} />
        <Button
          type="submit"
          variant="outline"
          className="h-11 px-4"
          disabled={present.length === 0}
        >
          <Award aria-hidden />
          Enviar certificado aos {present.length} presentes
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          Use no fim do curso. Reenviar no mesmo dia não duplica o e-mail.
        </p>
      </form>
    </div>
  );
}
