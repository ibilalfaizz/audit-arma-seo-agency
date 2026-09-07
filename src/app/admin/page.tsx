import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, isValidSessionCookie } from "@/lib/admin-session";
import { listPartners } from "@/lib/partners-store";
import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ARMA Admin — Partner Links",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionCookie(token)) {
    redirect("/admin/login");
  }

  const partners = await listPartners();

  return <AdminClient initialPartners={partners} />;
}
