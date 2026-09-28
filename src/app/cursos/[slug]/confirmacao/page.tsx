import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { courseHref } from "@/lib/courses";
import { findCourse } from "@/lib/server/courses";
import { findEnrollment } from "@/lib/server/enrollments";
import { syncPayment } from "@/lib/server/payments";

export const metadata: Metadata = {
  title: "Status da matrícula",
  robots: { index: false, follow: false },
};

/**
 * Para onde o Mercado Pago devolve o aluno. O estado vem do banco; se ainda
 * estiver pendente e o MP mandou o payment_id na URL, consulta a API na hora —
 * cobre o intervalo até o webhook chegar, sem confiar nos parâmetros da URL.
 */
export default async function ConfirmationPage({
  params,
  searchParams,
}: PageProps<"/cursos/[slug]/confirmacao">) {
  const { slug } = await params;
  const query = await searchParams;
  const course = await findCourse(slug);
  const enrollmentId =
    typeof query.matricula === "string" ? query.matricula : "";
  let enrollment = await findEnrollment(enrollmentId);
  if (!course || !enrollment || enrollment.course_id !== course.slug) {
    notFound();
  }

  const paymentId =
    typeof query.payment_id === "string" && /^\d+$/.test(query.payment_id)
      ? query.payment_id
      : null;
  if (enrollment.payment_status === "pending" && paymentId) {
    const synced = await syncPayment(paymentId, "sistema").catch(() => null);
    if (synced?.id === enrollment.id) enrollment = synced;
  }

  const firstName = enrollment.buyer_name.split(" ")[0];
  const state = {
    approved: {
      icon: CheckCircle2,
      title: `Vaga garantida, ${firstName}!`,
      text: `Enviamos para ${enrollment.buyer_email} a confirmação com data, local e o QR code de entrada. Não achou? Olhe a caixa de spam.`,
    },
    pending: {
      icon: Clock,
      title: "Pagamento em processamento",
      text: "Assim que o Mercado Pago confirmar, você recebe o e-mail com o QR code de entrada. No Pix, costuma levar poucos segundos — recarregue esta página em instantes.",
    },
    cancelled: {
      icon: XCircle,
      title: "O pagamento não foi concluído",
      text: "Nenhum valor foi cobrado. Você pode tentar de novo com outro meio de pagamento.",
    },
    refunded: {
      icon: CheckCircle2,
      title: "Matrícula reembolsada",
      text: "O reembolso desta matrícula já foi processado.",
    },
  }[enrollment.payment_status];
  const Icon = state.icon;

  return (
    <main className="pillar-impressao-3d flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl px-6 py-24">
        <Icon aria-hidden className="size-10 text-primary" />
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-balance">
          {state.title}
        </h1>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          {state.text}
        </p>
        <p className="mt-6 font-mono text-xs tracking-wide text-muted-foreground">
          {course.title} · matrícula {enrollment.id}
        </p>
        <Button asChild size="lg" variant="outline" className="mt-10 h-11 px-5">
          <Link
            href={
              enrollment.payment_status === "cancelled"
                ? `${courseHref(course)}#matricula`
                : courseHref(course)
            }
          >
            {enrollment.payment_status === "cancelled"
              ? "Tentar de novo"
              : "Voltar para o curso"}
          </Link>
        </Button>
      </div>
    </main>
  );
}
