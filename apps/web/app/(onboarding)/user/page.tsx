"use client";

import { useRouter } from "next/navigation";

export default function OnboardUser() {
  const router = useRouter();
  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Onboarding — User</h1>
      <p>TODO: gather user profile fields.</p>
      <button onClick={() => router.push("/onboarding/org")}>
        Next: Organization
      </button>
    </main>
  );
}
