"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, createSessionCookieValue } from "@/lib/admin-session";

export interface LoginState {
  error?: string;
}

export async function login(prevState: LoginState | null, formData: FormData): Promise<LoginState> {
  const password = formData.get("password")?.toString() ?? "";
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return { error: "Admin password is not configured on the server. Set ADMIN_PASSWORD in .env.local." };
  }
  if (password !== expected) {
    return { error: "Incorrect password." };
  }

  const { value, maxAge } = createSessionCookieValue();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  redirect("/admin");
}
