"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordClient() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  async function doReset() {
    const r = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      router.push("/login");
    } else {
      setMessage("Reset failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Reset Password</h1>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={doReset}>Reset</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
