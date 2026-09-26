import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PillarPage } from "@/components/pillar-page";
import { CourseTeaser } from "@/components/sections/course-teaser";
import { PartViewer } from "@/components/sections/part-viewer";
import { pillarBySlug } from "@/lib/content";
import { courseBySlug } from "@/lib/courses";

const pillar = pillarBySlug("impressao-3d");
const course = courseBySlug("impressao-3d-basic");

export const metadata: Metadata = {
  title: "Impressão 3D",
  description: pillar?.summary,
  alternates: { canonical: "/impressao-3d" },
};

export default function Impressao3dPage() {
  if (!pillar) notFound();
  return (
    <PillarPage
      pillar={pillar}
      extra={
        <>
          <PartViewer />
          {course ? <CourseTeaser course={course} /> : null}
        </>
      }
    />
  );
}
