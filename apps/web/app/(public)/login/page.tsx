"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    
    try {
      // Dynamic import to reduce initial bundle size and improve performance
      const [{ auth }, { signInWithEmailAndPassword }] = await Promise.all([
        import("@/lib/firebase.client"),
        import("firebase/auth"),
      ]);

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken(true);
      
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        throw new Error("Session exchange failed");
      }
      
      router.push("/onboarding");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <input 
          placeholder="Email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={busy}
        />
        <input 
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          disabled={busy}
        />
        <button disabled={busy || !email || !password} type="submit">
          {busy ? "Signing in..." : "Login"}
        </button>
      </form>
      
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <a href="/register">Sign Up</a>
        <a href="/forgot-password">Forgot Password</a>
      </div>
      
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
