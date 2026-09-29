import type { MetadataRoute } from "next";
import { allowIndexing } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/certificado/", "/reembolso/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
