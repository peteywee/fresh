"use client";

import { useRouter } from "next/navigation";

export default function OnboardOrg() {
  const router = useRouter();
  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Onboarding — Organization</h1>
      <p>TODO: create or join an org. This will save to API later.</p>
      <button onClick={() => router.push("/onboarding")}>Finish</button>
    </main>
  );
}
