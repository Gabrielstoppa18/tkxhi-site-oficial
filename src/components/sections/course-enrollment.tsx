import Link from "next/link";
import { ContactActions } from "@/components/contact-actions";
import {
  EnrollmentForm,
  type CohortOption,
} from "@/components/enrollment-form";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/section-heading";
import { CONSENT_VERSION, consentItems } from "@/lib/consent";
import type { Cohort, Course } from "@/lib/courses";
import { formatBRL, formatDate, formatTime } from "@/lib/format";

export type PublicCohort = Cohort & { soldOut: boolean };

export function CourseEnrollment({
  course,
  cohorts,
}: {
  course: Course;
  cohorts: PublicCohort[];
}) {
  const first = cohorts[0];
  const allSoldOut =
    cohorts.length > 0 && cohorts.every((item) => item.soldOut);
  const options: CohortOption[] = cohorts.map((cohort) => ({
    id: cohort.id,
    title: cohort.label ?? formatDate(cohort.startsAt),
    detail: `${formatDate(cohort.startsAt)}, ${formatTime(cohort.startsAt)} · ${cohort.venue} · ${formatBRL(cohort.priceCents)}`,
    soldOut: cohort.soldOut,
    consentItems: consentItems(course, cohort),
  }));
  // Uma política só aparece em números quando todas as turmas concordam.
  const samePolicy =
    first &&
    cohorts.every(
      (item) =>
        item.lateRefundPercent === first.lateRefundPercent &&
        item.lateRefundDaysBefore === first.lateRefundDaysBefore,
    );

  return (
    <section
      id="matricula"
      className="scroll-mt-16 border-t border-border/70 bg-card"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="Matrícula"
            title={
              first
                ? cohorts.length === 1
                  ? `${formatBRL(first.priceCents)} por aluno`
                  : `${cohorts.length} turmas abertas`
                : "Próxima turma em breve"
            }
            lead={
              first
                ? allSoldOut
                  ? "As vagas acabaram. Fale com a gente para entrar na lista de espera."
                  : `Turmas de no máximo ${Math.max(...cohorts.map((item) => item.capacity))} pessoas, para dar atenção a cada impressora.`
                : "Ainda estamos fechando data e local. Fale com a gente para ser avisado quando as inscrições abrirem."
            }
          />

          <div className="mt-10 space-y-4 border-l-2 border-primary pl-5">
            <h3 className="font-mono text-[0.7rem] tracking-[0.22em] uppercase">
              Reembolso, sem letra miúda
            </h3>
            <ul className="space-y-3 text-pretty text-muted-foreground">
              <li>
                <strong className="text-foreground">Até 7 dias</strong> após o
                pagamento, sem ter participado: valor integral, na hora.
              </li>
              <li>
                <strong className="text-foreground">Depois dos 7 dias</strong>,
                sem ter participado:{" "}
                {samePolicy && first.lateRefundPercent > 0
                  ? `${first.lateRefundPercent}% do valor, pedindo até ${first.lateRefundDaysBefore} dias antes da turma.`
                  : "conforme as condições da turma, mostradas antes do pagamento."}
              </li>
              <li>
                <strong className="text-foreground">
                  Depois de participar
                </strong>
                : o pedido é analisado individualmente, porque o curso já foi
                entregue.
              </li>
            </ul>
            <p className="text-sm">
              <Link
                href="/reembolso"
                className="text-primary underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Pedir reembolso de uma matrícula
              </Link>
            </p>
          </div>
        </div>

        <Reveal delay={0.08} className="lg:col-span-7">
          <div className="border border-border bg-background p-6 sm:p-8">
            {first && !allSoldOut ? (
              <EnrollmentForm
                cohorts={options}
                consentVersion={CONSENT_VERSION}
              />
            ) : (
              <>
                <p className="text-lg text-pretty">
                  {allSoldOut
                    ? "Esta turma lotou. Mande uma mensagem e avisamos quando abrir a próxima."
                    : "Quer garantir lugar na primeira turma? Mande uma mensagem e avisamos assim que as inscrições abrirem."}
                </p>
                <ContactActions className="mt-6" />
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
