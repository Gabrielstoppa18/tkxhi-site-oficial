import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseEnrollment } from "@/components/sections/course-enrollment";
import { CourseHero } from "@/components/sections/course-hero";
import { CourseModules } from "@/components/sections/course-modules";
import { CourseSpecs } from "@/components/sections/course-specs";
import { COURSE_PILLARS, courseHref } from "@/lib/courses";
import { publicCohorts } from "@/lib/server/cohorts";
import { publicCourse, publishedCourses } from "@/lib/server/courses";

// Estática (boa para SEO e velocidade), refeita a cada 5 minutos e na hora em
// que o curso ou uma turma é editada, ou uma vaga muda de dono.
export const revalidate = 300;
// Curso criado no painel depois do build ganha página na primeira visita.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await publishedCourses()).map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/cursos/[slug]">): Promise<Metadata> {
  const course = await publicCourse((await params).slug);
  if (!course) return {};
  return {
    title: `Curso ${course.title}`,
    description: `${course.tagline} ${course.lead}`,
    alternates: { canonical: courseHref(course) },
    // Curso arquivado mantém a página (links antigos), mas sai da busca.
    robots:
      course.status === "archived" ? { index: false, follow: true } : undefined,
  };
}

export default async function CoursePage({
  params,
}: PageProps<"/cursos/[slug]">) {
  const course = await publicCourse((await params).slug);
  if (!course) notFound();

  // Vai para o navegador só o que a página mostra: sem contagem de pagantes.
  const cohorts =
    course.status === "published"
      ? (await publicCohorts(course.slug)).map((cohort) => ({
          id: cohort.id,
          courseId: cohort.courseId,
          label: cohort.label,
          startsAt: cohort.startsAt,
          endsAt: cohort.endsAt,
          venue: cohort.venue,
          address: cohort.address,
          priceCents: cohort.priceCents,
          capacity: cohort.capacity,
          lateRefundPercent: cohort.lateRefundPercent,
          lateRefundDaysBefore: cohort.lateRefundDaysBefore,
          status: cohort.status,
          soldOut: cohort.taken >= cohort.capacity,
        }))
      : [];
  const next = cohorts.find((item) => !item.soldOut) ?? cohorts[0] ?? null;

  return (
    <main
      className={`${COURSE_PILLARS[course.pillar].colorClass} flex flex-1 flex-col`}
    >
      <CourseHero course={course} next={next} />
      <CourseModules course={course} />
      <CourseSpecs course={course} />
      <CourseEnrollment course={course} cohorts={cohorts} />
    </main>
  );
}
