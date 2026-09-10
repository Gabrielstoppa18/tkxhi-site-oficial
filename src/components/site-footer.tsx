import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { legalNav, mainNav, siteConfig, whatsappUrl } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <Wordmark className="text-xl" />
            <p className="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">
              {siteConfig.tagline}. Engenharia, manufatura aditiva e editora
              técnica.
            </p>
          </div>

          <nav aria-label="Áreas de atuação">
            <h2 className="font-mono text-[0.7rem] tracking-[0.18em] uppercase">
              Atuação
            </h2>
            <ul className="mt-4 space-y-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[0.7rem] tracking-[0.18em] uppercase">
              Contato
            </h2>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              {whatsappUrl() ? (
                <li>
                  <a
                    href={whatsappUrl() ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <nav aria-label="Jurídico">
            <h2 className="font-mono text-[0.7rem] tracking-[0.18em] uppercase">
              Jurídico
            </h2>
            <ul className="mt-4 space-y-2">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/70 pt-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
          <p>CNPJ {siteConfig.cnpj}</p>
        </div>
      </div>
    </footer>
  );
}
