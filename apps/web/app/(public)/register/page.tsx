"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    orgChoice: "create",
    orgName: "",
    taxId: "",
    orgId: "",
    ssn: "",
    address: "",
    withholdingAllowances: 0
  });

  async function submit() {
    const body: any = {
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      orgChoice: form.orgChoice,
      w4: {
        ssn: form.ssn,
        address: form.address,
        withholdingAllowances: Number(form.withholdingAllowances)
      }
    };
    if (form.orgChoice === "create") {
      body.org = { name: form.orgName, taxId: form.taxId };
    } else {
      body.org = { id: form.orgId };
    }

    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert("Register failed: " + (d.error ?? r.statusText));
      return;
    }
    window.location.href = "/login";
  }

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 400 }}>
      <h1>Register</h1>
      <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      <input placeholder="Display Name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
      <select value={form.orgChoice} onChange={e => setForm({ ...form, orgChoice: e.target.value })}>
        <option value="create">Create Organization</option>
        <option value="join">Join Organization</option>
      </select>
      {form.orgChoice === "create" ? (
        <>
          <input placeholder="Organization Name" value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} />
          <input placeholder="Tax ID (12-3456789)" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} />
        </>
      ) : (
        <input placeholder="Organization ID" value={form.orgId} onChange={e => setForm({ ...form, orgId: e.target.value })} />
      )}
      <h3>W-4 Info</h3>
      <input placeholder="SSN (000-00-0000)" value={form.ssn} onChange={e => setForm({ ...form, ssn: e.target.value })} />
      <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
  <input type="number" placeholder="Withholding Allowances" value={form.withholdingAllowances} onChange={e => setForm({ ...form, withholdingAllowances: Number(e.target.value) })} />
      <button onClick={submit}>Submit</button>
    </main>
  );
}
