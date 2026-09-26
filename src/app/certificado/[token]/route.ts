import { courseBySlug } from "@/lib/courses";
import { audit } from "@/lib/server/audit";
import { renderCertificate } from "@/lib/server/certificate";
import { findCohort } from "@/lib/server/cohorts";
import { findByCertificateToken, isActive } from "@/lib/server/enrollments";
import { appUrl } from "@/lib/server/env";
import { clientIp } from "@/lib/server/request";
import { isOpaqueToken } from "@/lib/server/tokens";

/**
 * PDF do certificado. O link leva um token aleatório próprio da matrícula;
 * só existe para matrícula ativa com presença confirmada.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/certificado/[token]">,
) {
  const { token } = await params;
  const enrollment = isOpaqueToken(token)
    ? await findByCertificateToken(token)
    : null;
  const course = enrollment ? courseBySlug(enrollment.course_id) : undefined;
  const cohort = enrollment ? await findCohort(enrollment.cohort_id) : null;

  if (
    !enrollment ||
    !course ||
    !cohort ||
    !isActive(enrollment) ||
    !enrollment.attendance_confirmed
  ) {
    return new Response("Certificado indisponível.", { status: 404 });
  }

  const pdf = await renderCertificate(
    enrollment,
    course,
    cohort,
    `${appUrl()}/certificado/verificar/${enrollment.id}`,
  );
  await audit({
    actor: "aluno",
    action: "certificate_downloaded",
    enrollmentId: enrollment.id,
    ip: clientIp(request.headers),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${course.slug}.pdf"`,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
