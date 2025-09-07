"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Form = {
  email: string;
  password: string;
  displayName: string;
  orgChoice: "create" | "join";
  orgName: string;
  orgId: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    email: "",
    password: "",
    displayName: "",
    orgChoice: "create",
    orgName: "",
    orgId: "",
  });
  const [msg, setMsg] = useState("");

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("");
    const body: any = {
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      orgChoice: form.orgChoice,
      org:
        form.orgChoice === "create"
          ? { name: form.orgName }
          : { id: form.orgId },
    };

    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg("Register failed: " + (d.error ?? r.statusText));
      return;
    }
    router.push("/login");
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, display: "grid", gap: 12 }}>
      <h1>Register</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="new-password"
        />
        <input
          placeholder="Display Name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />

        <select
          value={form.orgChoice}
          onChange={(e) =>
            setForm({ ...form, orgChoice: e.target.value as Form["orgChoice"] })
          }
        >
          <option value="create">Create Organization</option>
          <option value="join">Join Organization</option>
        </select>

        {form.orgChoice === "create" ? (
          <input
            placeholder="Organization Name"
            value={form.orgName}
            onChange={(e) => setForm({ ...form, orgName: e.target.value })}
          />
        ) : (
          <input
            placeholder="Organization ID"
            value={form.orgId}
            onChange={(e) => setForm({ ...form, orgId: e.target.value })}
          />
        )}

        <button type="submit">Create account</button>
      </form>

      <button onClick={() => router.push("/login")}>Back to login</button>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
    </main>
  );
}
