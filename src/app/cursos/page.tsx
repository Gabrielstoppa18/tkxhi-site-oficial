import type { Metadata } from "next";
import { CoursesCatalog } from "@/components/sections/courses-catalog";
import { nextOpenCohorts } from "@/lib/server/cohorts";
import { publishedCourses } from "@/lib/server/courses";

// Estática, refeita a cada 5 minutos e sempre que um curso ou turma muda.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Cursos",
  description:
    "Cursos presenciais da TkxHi em turmas pequenas, com prática em bancada e certificado de participação.",
  alternates: { canonical: "/cursos" },
};

export default async function CoursesPage() {
  const [courses, next] = await Promise.all([
    publishedCourses(),
    nextOpenCohorts(),
  ]);
  return (
    <main className="flex flex-1 flex-col">
      <CoursesCatalog courses={courses} next={next} />
    </main>
  );
}
