export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getSession } from "../lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session?.loggedIn) return redirect("/login");
  if (!session?.onboarded) return redirect("/onboarding");
  return redirect("/dashboard");
}
