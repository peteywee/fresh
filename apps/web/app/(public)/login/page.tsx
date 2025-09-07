"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 4 && !loading;
  }, [email, password, loading]);

  async function doLogin(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setMsg("");
    setLoading(true);
    try {
  const r = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (r.ok) {
        router.push("/onboarding");
      } else {
        const d = await r.json().catch(() => ({}));
        setMsg(d?.error || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>
      <form onSubmit={doLogin} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          minLength={4}
          required
        />
        <button type="submit" disabled={!canSubmit} aria-busy={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button type="button" onClick={() => router.push("/register")}>
          Sign Up
        </button>
        <button type="button" onClick={() => router.push("/forgot-password")}>
          Forgot Password
        </button>
      </div>

      {msg && (
        <p role="alert" aria-live="polite" style={{ color: "crimson", marginTop: 12 }}>
          {msg}
        </p>
      )}
    </main>
  );
}
