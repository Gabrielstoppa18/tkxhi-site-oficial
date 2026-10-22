"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createManualEnrollment } from "@/lib/server/manual-enrollment";
import { clientIp, userAgent } from "@/lib/server/request";
import { requireAdmin } from "@/lib/server/session";

/** Volta ao formulário no erro, para o admin não redigitar tudo. */
export type ManualEnrollmentValues = Partial<
  Record<"name" | "email" | "phone" | "cpf" | "amount" | "partner", string>
>;

export type ManualEnrollmentState =
  | { status: "idle" }
  | { status: "error"; error: string; values: ManualEnrollmentValues }
  | {
      status: "created";
      name: string;
      emailSent: boolean;
      askedEmail: boolean;
    };

/** Matrícula feita pela equipe no painel (parcerias, cortesias). */
export async function createManualEnrollmentAction(
  _state: ManualEnrollmentState,
  formData: FormData,
): Promise<ManualEnrollmentState> {
  const principal = await requireAdmin("/admin/turmas");
  const requestHeaders = await headers();
  const field = (name: string, max = 200) =>
    String(formData.get(name) ?? "").slice(0, max);
  const sendEmail = formData.get("sendEmail") === "on";

  const result = await createManualEnrollment(
    {
      cohortId: field("cohortId", 40),
      name: field("name", 160),
      email: field("email"),
      phone: field("phone", 30),
      cpf: field("cpf", 20),
      amount: field("amount", 12),
      partner: field("partner", 160),
      sendEmail,
    },
    {
      actor: principal.actor,
      ip: clientIp(requestHeaders),
      userAgent: userAgent(requestHeaders),
    },
  );
  revalidatePath("/admin", "layout");

  return result.ok
    ? {
        status: "created",
        name: field("name", 160).trim(),
        emailSent: result.emailSent,
        askedEmail: sendEmail,
      }
    : {
        status: "error",
        error: result.error,
        values: {
          name: field("name", 160),
          email: field("email"),
          phone: field("phone", 30),
          cpf: field("cpf", 20),
          amount: field("amount", 12),
          partner: field("partner", 160),
        },
      };
}
