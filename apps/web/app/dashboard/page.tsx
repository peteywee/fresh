export const dynamic = "force-dynamic";
import { getSession } from "../../lib/session";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getSession();
  if (!session?.loggedIn) return redirect("/login");
  if (!session?.onboarded) return redirect("/onboarding");

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {session.displayName ?? "User"} — org: {session.orgName ?? "N/A"}</p>
    </main>
  );
}
