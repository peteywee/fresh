"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginHomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    fetch("/api/session/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          if (data.user.onboardingComplete) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } else {
          setIsCheckingAuth(false);
        }
      })
      .catch(() => {
        setIsCheckingAuth(false);
      });
  }, [router]);

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

  if (isCheckingAuth) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>Fresh</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>Welcome to Fresh</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Sign in to your account to get started.
      </p>
      
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <input 
          placeholder="Email" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={busy}
          style={{
            padding: "0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "1rem"
          }}
        />
        <input 
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          disabled={busy}
          style={{
            padding: "0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "1rem"
          }}
        />
        <button 
          disabled={busy || !email || !password} 
          type="submit"
          style={{
            padding: "0.75rem",
            backgroundColor: busy ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: busy ? "not-allowed" : "pointer"
          }}
        >
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>
      
      <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center" }}>
        <a href="/register" style={{ color: "#3b82f6", textDecoration: "none" }}>
          Create Account
        </a>
        <span style={{ color: "#d1d5db" }}>|</span>
        <a href="/forgot-password" style={{ color: "#3b82f6", textDecoration: "none" }}>
          Forgot Password?
        </a>
      </div>
      
      {error && (
        <p style={{ 
          color: "#ef4444", 
          marginTop: "1rem", 
          textAlign: "center",
          padding: "0.75rem",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "6px"
        }}>
          {error}
        </p>
      )}
    </main>
  );
}
