import { getPartnerMap } from "@/lib/partners-store";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const partners = await getPartnerMap();
  return <HomeClient partners={partners} />;
}
