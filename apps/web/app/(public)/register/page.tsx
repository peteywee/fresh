"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function doRegister() {
    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      router.push("/login");
    } else {
      setMessage("Register failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Sign Up</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={doRegister}>Create Account</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
