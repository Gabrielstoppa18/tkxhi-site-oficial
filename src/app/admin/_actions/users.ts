"use server";

import { revalidatePath } from "next/cache";
import { createAdmin, resetAdmin, setAdminActive } from "@/lib/server/admins";
import { isUuid } from "@/lib/server/enrollments";
import { requireMaster } from "@/lib/server/session";

/**
 * Gestão de admins — só o master. A senha temporária volta na resposta da
 * action, nunca na URL (que ficaria no histórico e nos logs), e aparece uma
 * única vez na tela.
 */
export type UserActionState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "created"; username: string; password: string };

export async function createAdminAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const master = await requireMaster();
  const result = await createAdmin({
    username: String(formData.get("username") ?? "").slice(0, 64),
    displayName: String(formData.get("displayName") ?? "").slice(0, 120),
    actor: master.actor,
  });
  revalidatePath("/admin/usuarios");
  return result.ok
    ? {
        status: "created",
        username: String(formData.get("username")).trim().toLowerCase(),
        password: result.password,
      }
    : { status: "error", error: result.error };
}

export async function resetAdminAction(
  _state: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const master = await requireMaster();
  const id = String(formData.get("adminId") ?? "");
  if (!isUuid(id)) return { status: "error", error: "Admin inválido." };
  const result = await resetAdmin(id, master.actor);
  revalidatePath("/admin/usuarios");
  return result.ok
    ? {
        status: "created",
        username: result.username,
        password: result.password,
      }
    : { status: "error", error: result.error };
}

export async function toggleAdminAction(formData: FormData) {
  const master = await requireMaster();
  const id = String(formData.get("adminId") ?? "");
  if (!isUuid(id)) throw new Error("Admin inválido.");
  await setAdminActive(id, formData.get("active") === "true", master.actor);
  revalidatePath("/admin/usuarios");
}
