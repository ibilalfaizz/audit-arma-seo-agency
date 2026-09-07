"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidSessionCookie } from "@/lib/admin-session";
import { createPartner, type PartnerRecord } from "@/lib/partners-store";

async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionCookie(token)) {
    redirect("/admin/login");
  }
}

export interface CreatePartnerState {
  success: boolean;
  error?: string;
  record?: PartnerRecord;
}

export async function createPartnerLink(prevState: CreatePartnerState | null, formData: FormData): Promise<CreatePartnerState> {
  await requireAdmin();

  const name = formData.get("name")?.toString() ?? "";
  const slug = formData.get("slug")?.toString() ?? "";

  const result = await createPartner(name, slug);
  if (!result.ok) {
    return { success: false, error: result.error };
  }
  return { success: true, record: result.record };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
