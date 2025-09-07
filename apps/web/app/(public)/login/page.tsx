"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  async function doLogin() {
    if (attempts >= 5) {
      setMessage("Too many failed attempts. Please wait before trying again.");
      return;
    }
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      window.location.href = "/dashboard";
    } else {
      setAttempts(attempts + 1);
      setMessage("Login failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={doLogin}>Login</button>
      <button onClick={() => router.push("/register")}>Sign Up</button>
      <button onClick={() => router.push("/forgot-password")}>Forgot Password</button>
      {message && <p>{message}</p>}
    </main>
  );
}
