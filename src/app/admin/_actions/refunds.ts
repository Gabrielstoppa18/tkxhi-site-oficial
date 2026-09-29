"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/server/enrollments";
import { approveManualRefund, denyRefund } from "@/lib/server/refunds";
import { requireAdmin } from "@/lib/server/session";

function enrollmentIdFrom(formData: FormData): string {
  const id = String(formData.get("enrollmentId") ?? "");
  if (!isUuid(id)) throw new Error("Matrícula inválida.");
  return id;
}

function back(result: { ok: true } | { ok: false; error: string }, ok: string) {
  revalidatePath("/admin", "layout");
  redirect(
    result.ok
      ? `/admin/reembolsos?ok=${ok}`
      : `/admin/reembolsos?erro=${encodeURIComponent(result.error)}`,
  );
}

export async function approveRefundAction(formData: FormData) {
  const principal = await requireAdmin("/admin/reembolsos");
  const id = enrollmentIdFrom(formData);
  const reais = Number(
    String(formData.get("amount") ?? "")
      .slice(0, 12)
      .replace(",", "."),
  );
  const amountCents = Math.round(reais * 100);
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 1000);

  back(
    Number.isFinite(amountCents) && amountCents > 0
      ? await approveManualRefund(id, principal.actor, amountCents, note)
      : { ok: false, error: "Valor inválido." },
    "aprovado",
  );
}

export async function denyRefundAction(formData: FormData) {
  const principal = await requireAdmin("/admin/reembolsos");
  const id = enrollmentIdFrom(formData);
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 1000);
  if (note.length < 10) {
    back(
      {
        ok: false,
        error: "Escreva o motivo da negativa: ele vai para o aluno.",
      },
      "",
    );
  }
  back(await denyRefund(id, principal.actor, note), "negado");
}
