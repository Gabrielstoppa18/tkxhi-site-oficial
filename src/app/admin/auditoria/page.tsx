import { formatDateTime } from "@/lib/format";
import { recentAudit } from "@/lib/server/audit";
import { requireAdmin } from "@/lib/server/session";

/** Os últimos eventos, do mais novo para o mais antigo. Somente leitura. */
export default async function AuditPage() {
  await requireAdmin("/admin/auditoria");
  const entries = await recentAudit(300);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Auditoria
      </h1>
      <p className="mt-2 text-muted-foreground">
        Últimos {entries.length} eventos. O banco recusa edição e exclusão
        destes registros.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="font-mono text-[0.7rem] tracking-[0.18em] text-muted-foreground uppercase">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-4 font-normal">
                Quando
              </th>
              <th scope="col" className="py-2 pr-4 font-normal">
                Quem
              </th>
              <th scope="col" className="py-2 pr-4 font-normal">
                Ação
              </th>
              <th scope="col" className="py-2 pr-4 font-normal">
                Matrícula
              </th>
              <th scope="col" className="py-2 font-normal">
                Detalhes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="align-top">
                <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">
                  {formatDateTime(entry.created_at)}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">{entry.actor}</td>
                <td className="py-2 pr-4 font-mono text-xs">{entry.action}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  {entry.enrollment_id?.slice(0, 8) ?? "—"}
                </td>
                <td className="py-2 font-mono text-xs break-all text-muted-foreground">
                  {entry.ip ? `IP ${entry.ip} · ` : ""}
                  {JSON.stringify(entry.details)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
