import type { MetadataRoute } from "next";
import { pillars } from "@/lib/content";
import { siteConfig } from "@/lib/site-config";

/** Registre cada rota nova aqui — o sitemap não é gerado automaticamente. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

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
  ];
}
