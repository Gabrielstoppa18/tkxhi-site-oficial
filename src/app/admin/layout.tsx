import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentPrincipal } from "@/lib/server/session";
import { logout } from "./_actions/auth";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
  // Tokens vão na URL (QR de check-in): não podem vazar no Referer.
  referrer: "no-referrer",
};

const nav = [
  { href: "/admin/checkin", label: "Check-in" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/turmas", label: "Turmas" },
  { href: "/admin/reembolsos", label: "Reembolsos" },
  { href: "/admin/auditoria", label: "Auditoria" },
];

/**
 * Casca do painel. Só desenha a navegação — a proteção de verdade está em
 * `requireAdmin()` no topo de cada página e de cada server action.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const principal = await currentPrincipal();
  const full = principal?.stage === "full";

  return (
    <main className="flex flex-1 flex-col">
      {principal ? (
        <div className="border-b border-border/70 bg-card">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
            {full ? (
              <nav aria-label="Painel" className="flex flex-wrap gap-1">
                {[
                  ...nav,
                  ...(principal.kind === "master"
                    ? [{ href: "/admin/usuarios", label: "Usuários" }]
                    : []),
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex h-11 items-center rounded-sm px-3 font-mono text-xs tracking-[0.18em] uppercase hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            ) : null}
            <form action={logout} className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {principal.displayName}
              </span>
              <Button type="submit" variant="ghost" className="h-11">
                <LogOut aria-hidden />
                Sair
              </Button>
            </form>
          </div>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
    </main>
  );
}
