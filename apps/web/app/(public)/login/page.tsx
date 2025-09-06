"use client";

export default function LoginPage() {
  async function doLogin() {
    await fetch("/api/session/login", { method: "POST" });
    window.location.href = "/onboarding";
  }
  return (
    <main>
      <h1>Login</h1>
      <p>This demo sets a local session cookie (no external IdP yet).</p>
      <button onClick={doLogin} style={{ padding: "8px 16px" }}>Login</button>
    </main>
  );
}
