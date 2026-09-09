import type { Metadata } from "next";
import { HeroSection } from "@/components/ui/hero-section-shadcnui";

/** Rota de preview isolado do componente. Fora do sitemap e não indexável. */
export const metadata: Metadata = {
  title: "Demo",
  robots: { index: false, follow: false },
};

export default function Demo() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <HeroSection />
    </div>
  );
}
