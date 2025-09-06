"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit() {
    const r = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const d = await r.json();
    if (!r.ok) {
      alert("Failed: " + (d.error ?? r.statusText));
      return;
    }
    setMessage(d.message);
  }

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 400 }}>
      <h1>Forgot Password</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={submit}>Submit</button>
      {message && <p>{message}</p>}
    </main>
  );
}
