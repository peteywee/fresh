#!/usr/bin/env bash
set -euo pipefail

echo "==> [007A] Fixing Login page redirects..."
mkdir -p 'apps/web/app/(public)/login'
cat > 'apps/web/app/(public)/login/page.tsx' <<'TSX'
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
      router.push("/onboarding");
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
TSX

echo "==> [007B] Fixing Register page redirects..."
cat > apps/web/app/(public)/register/page.tsx <<'TSX'
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
TSX

echo "==> [007C] Fixing Forgot Password page redirects..."
cat > apps/web/app/(public)/forgot-password/page.tsx <<'TSX'
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
    if (r.ok && d.resetLink) {
      router.push(d.resetLink);
    } else {
      setMessage("Request failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Forgot Password</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={doForgot}>Send Reset Link</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
TSX

echo "==> [007D] Fixing Reset Password page redirects..."
cat > apps/web/app/(public)/reset-password/page.tsx <<'TSX'
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  async function doReset() {
    const r = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword })
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
      <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      <button onClick={doReset}>Reset</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
TSX

echo "==> [007E] Creating dev-fast.sh..."
mkdir -p scripts
cat > scripts/dev-fast.sh <<'BASH'
cat > scripts/dev-fast.sh <<'BASH'
#!/usr/bin/env bash
# Run API + Web in parallel
trap "kill 0" EXIT
pnpm --filter @services/api dev & 
pnpm --filter @apps/web dev & 
wait
BASH
chmod +x scripts/dev-fast.sh

echo "==> [007F] Creating checkpoint.sh..."
cat > 'scripts/checkpoint.sh' <<'BASH'
#!/usr/bin/env bash
set -euo pipefail
MSG=${1:-"Checkpoint: save state"}
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git add -A
git commit -m "$MSG" || echo "Nothing to commit"
git push origin $BRANCH
BASH
chmod +x scripts/checkpoint.sh

echo "==> [007G] Scaffolding onboarding stubs..."
mkdir -p apps/web/app/(onboarding)/user
mkdir -p apps/web/app/(onboarding)/org

cat > apps/web/app/(onboarding)/user/page.tsx <<'TSX'
export default function UserOnboarding() {
  return (
    <main>
      <h1>User Onboarding</h1>
      <p>Placeholder form for user profile setup.</p>
    </main>
  );
}
TSX

cat > apps/web/app/(onboarding)/org/page.tsx <<'TSX'
export default function OrgOnboarding() {
  return (
    <main>
      <h1>Organization Onboarding</h1>
      <p>Placeholder form for org setup.</p>
    </main>
  );
}
TSX

echo "==> Done. Redirects fixed, dev scripts created, onboarding stubs added."
