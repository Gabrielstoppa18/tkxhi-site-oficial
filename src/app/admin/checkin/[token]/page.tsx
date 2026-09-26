import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseBySlug } from "@/lib/courses";
import { formatDateTime } from "@/lib/format";
import { findByCheckinToken, isActive } from "@/lib/server/enrollments";
import { requireAdmin } from "@/lib/server/session";
import { isOpaqueToken } from "@/lib/server/tokens";
import { confirmCheckin } from "../../_actions/checkin";

/**
 * Destino do QR code. Abrir a página não marca presença — é preciso tocar no
 * botão. Assim um link pré-carregado pelo leitor de e-mail do aluno, ou pelo
 * próprio aluno, não registra presença de ninguém.
 */
export default async function CheckinTokenPage({
  params,
}: PageProps<"/admin/checkin/[token]">) {
  const { token } = await params;
  await requireAdmin(`/admin/checkin/${token}`);

  const enrollment = isOpaqueToken(token)
    ? await findByCheckinToken(token)
    : null;

  if (!enrollment) {
    return (
      <Notice title="QR code não reconhecido">
        Este código não corresponde a nenhuma matrícula. Procure o aluno pelo
        nome na lista.
      </Notice>
    );
  }

  const course = courseBySlug(enrollment.course_id);

  if (!isActive(enrollment)) {
    return (
      <Notice title={`${enrollment.buyer_name}: matrícula sem pagamento ativo`}>
        Pagamento: {enrollment.payment_status} · reembolso:{" "}
        {enrollment.refund_status}. Não marque presença antes de conferir com o
        aluno.
      </Notice>
    );
  }

  return (
    <div className="mx-auto max-w-md py-6 text-center">
      <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
        {course?.title ?? enrollment.course_id}
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-balance">
        {enrollment.buyer_name}
      </h1>

      {enrollment.attendance_confirmed ? (
        <p className="mt-8 flex items-center justify-center gap-2 text-lg text-primary">
          <CheckCircle2 aria-hidden className="size-6" />
          Presença já registrada em{" "}
          {formatDateTime(enrollment.attendance_timestamp!)}
        </p>
      ) : (
        <form action={confirmCheckin} className="mt-10">
          <input type="hidden" name="enrollmentId" value={enrollment.id} />
          <input type="hidden" name="via" value="qr" />
          <Button type="submit" size="lg" className="h-14 w-full text-lg">
            Confirmar presença
          </Button>
        </form>
      )}

      <Link
        href={`/admin/checkin?turma=${enrollment.cohort_id}`}
        className="mt-8 inline-flex h-11 items-center text-sm text-muted-foreground underline underline-offset-4"
      >
        Ver lista da turma
      </Link>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-6">
      <AlertTriangle aria-hidden className="size-8 text-destructive" />
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 text-muted-foreground">{children}</p>
      <Link
        href="/admin/checkin"
        className="mt-6 inline-flex h-11 items-center text-sm underline underline-offset-4"
      >
        Abrir a lista
      </Link>
    </div>
  );
}
