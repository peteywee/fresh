"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setBusy(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setBusy(false);
      return;
    }

    try {
      // Dynamic import to reduce initial bundle size
      const [{ auth }, { createUserWithEmailAndPassword, updateProfile }] = await Promise.all([
        import("@/lib/firebase.client"),
        import("firebase/auth"),
      ]);

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(user, { displayName });
      
      // Get ID token and exchange for session cookie
      const idToken = await user.getIdToken(true);
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        throw new Error("Session exchange failed");
      }
      
      // Always go to onboarding for new users
      window.location.href = "/onboarding";
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (e.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (e.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(e?.message || "Registration failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Create Your Account
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Join Fresh to get started with your team workspace
        </p>
      </div>
      
      <form onSubmit={handleRegister} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Full Name
          </label>
          <input 
            placeholder="Enter your full name" 
            type="text" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            required 
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Email Address
          </label>
          <input 
            placeholder="Enter your email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Password
          </label>
          <input 
            placeholder="Enter password (min 6 characters)" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Confirm Password
          </label>
          <input 
            placeholder="Confirm your password" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            minLength={6}
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <button 
          disabled={busy || !email || !password || !displayName || password !== confirmPassword} 
          type="submit"
          style={{
            width: "100%",
            padding: "12px 24px",
            backgroundColor: busy || !email || !password || !displayName || password !== confirmPassword ? "#9ca3af" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: busy || !email || !password || !displayName || password !== confirmPassword ? "not-allowed" : "pointer",
            transition: "background-color 0.2s"
          }}
        >
          {busy ? "Creating Account..." : "Create Account"}
        </button>
      </form>
      
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <span style={{ color: "#6b7280", fontSize: 14 }}>Already have an account? </span>
        <a href="/login" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
          Sign in here
        </a>
      </div>
      
      {error && (
        <div style={{ 
          color: "#dc2626", 
          backgroundColor: "#fef2f2", 
          padding: "12px 16px", 
          borderRadius: "8px", 
          marginTop: "16px",
          border: "1px solid #fecaca",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
    </main>
  );
}
