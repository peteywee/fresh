"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function doForgot() {
    const r = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      router.push("/reset-password");
    } else {
      setMessage("Request failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Forgot Password</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={doForgot}>Send Reset Link</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
