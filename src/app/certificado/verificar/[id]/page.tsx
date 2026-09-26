import type { Metadata } from "next";
import { connection } from "next/server";
import { BadgeCheck, XCircle } from "lucide-react";
import { courseBySlug } from "@/lib/courses";
import { formatDate, formatDateTime } from "@/lib/format";
import { findCohort } from "@/lib/server/cohorts";
import { findEnrollment, isActive } from "@/lib/server/enrollments";

export const metadata: Metadata = {
  title: "Verificar certificado",
  robots: { index: false, follow: false },
};

/**
 * Quem recebe um certificado (uma escola, um empregador) confere aqui se ele
 * é autêntico. Mostra só o que já está impresso no documento.
 */
export default async function VerifyCertificatePage({
  params,
}: PageProps<"/certificado/verificar/[id]">) {
  await connection();
  const { id } = await params;
  const enrollment = await findEnrollment(id);
  const course = enrollment ? courseBySlug(enrollment.course_id) : undefined;
  const cohort = enrollment ? await findCohort(enrollment.cohort_id) : null;
  const valid =
    enrollment &&
    course &&
    cohort &&
    isActive(enrollment) &&
    enrollment.attendance_confirmed;

  return (
    <main className="pillar-impressao-3d flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-xl px-6 py-24">
        {valid ? (
          <>
            <BadgeCheck aria-hidden className="size-10 text-primary" />
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
              Certificado válido
            </h1>
            <p className="mt-4 text-lg text-pretty">
              <strong>{enrollment.buyer_name}</strong> participou do curso{" "}
              {course.title}, em {formatDate(cohort.startsAt)}.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Presença registrada em{" "}
              {formatDateTime(enrollment.attendance_timestamp!)}.
            </p>
          </>
        ) : (
          <>
            <XCircle aria-hidden className="size-10 text-destructive" />
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
              Certificado não encontrado
            </h1>
            <p className="mt-4 text-lg text-pretty text-muted-foreground">
              Este código não corresponde a um certificado emitido pela TkxHi.
            </p>
          </>
        )}
        <p className="mt-8 font-mono text-xs break-all text-muted-foreground">
          Código {id}
        </p>
      </div>
    </main>
  );
}
