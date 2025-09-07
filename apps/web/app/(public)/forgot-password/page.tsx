"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("");
    const r = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setMsg(d.message ?? "Check your email for the reset token.");
      if (d.token) setToken(d.token); // dev-only convenience
    } else {
      setMsg(d.error ?? "Request failed");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Forgot Password</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button type="submit">Send reset token</button>
      </form>

      {token && (
        <div style={{ marginTop: 12 }}>
          <p>
            Dev token: <code>{token}</code>
          </p>
          <button
            onClick={() =>
              router.push(`/reset-password?token=${encodeURIComponent(token)}`)
            }
          >
            Continue to reset page
          </button>
        </div>
      )}

      {msg && <p style={{ color: "crimson", marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
