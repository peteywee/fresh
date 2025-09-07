"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function fetchSession() {
      const res = await fetch("/api/session/get");
      if (res.ok) {
        setSession(await res.json());
      } else {
        window.location.href = "/login";
      }
    }
    fetchSession();
  }, []);

  async function logout() {
    await fetch("/api/session/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!session) return <p>Loading...</p>;

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {session.displayName ?? "User"}!</p>
      <p>Your role: {session.role ?? "unknown"}</p>
      {session.role === "manager" && <p>You have manager-level access.</p>}
      {session.role === "user" && <p>You have user-level access.</p>}
      <button
        onClick={logout}
        style={{ marginTop: "16px", padding: "8px 16px" }}
      >
        Logout
      </button>
    </main>
  );
}
