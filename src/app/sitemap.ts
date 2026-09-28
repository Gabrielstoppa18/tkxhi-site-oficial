import type { MetadataRoute } from "next";
import { pillars } from "@/lib/content";
import { courseHref } from "@/lib/courses";
import { publishedCourses } from "@/lib/server/courses";
import { siteConfig } from "@/lib/site-config";

// Os cursos vêm do banco: o sitemap se refaz a cada hora.
export const revalidate = 3600;

/** Rotas fixas entram aqui à mão; os cursos publicados entram sozinhos. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const courses = await publishedCourses();

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...pillars.map((pillar) => ({
      url: `${siteConfig.url}${pillar.href}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${siteConfig.url}/cursos`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...courses.map((course) => ({
      url: `${siteConfig.url}${courseHref(course)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteConfig.url}/politica-de-privacidade`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
