"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type OnboardingStep = "welcome" | "create-org" | "join-org";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<OnboardingStep>("welcome");

  useEffect(() => {
    // Check authentication status
    fetch("/api/session/current")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
        } else if (data.user.onboardingComplete) {
          router.push("/dashboard");
        } else {
          setUser(data.user);
          // Check if there's a specific step in URL params
          const urlStep = searchParams.get("step") as OnboardingStep;
          if (urlStep && ["welcome", "create-org", "join-org"].includes(urlStep)) {
            setStep(urlStep);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
        setLoading(false);
      });
  }, [router, searchParams]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>Loading...</h1>
        <p>Setting up your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <div style={{ padding: 24 }}>Redirecting to login...</div>;
  }

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      {step === "welcome" && <WelcomeStep user={user} onNext={setStep} />}
      {step === "create-org" && <CreateOrgStep user={user} router={router} />}
      {step === "join-org" && <JoinOrgStep user={user} router={router} />}
    </main>
  );
}

function WelcomeStep({ user, onNext }: { user: any; onNext: (step: OnboardingStep) => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Welcome to Fresh! 👋</h1>
      <p style={{ fontSize: "1.1em", marginBottom: "2rem" }}>
        Hi {user.email}! Let's get you set up with your workspace.
      </p>
      
      <div style={{ display: "grid", gap: "1rem", maxWidth: 400, margin: "0 auto" }}>
        <div 
          style={{ 
            border: "2px solid #e2e8f0", 
            borderRadius: 8, 
            padding: "1.5rem", 
            cursor: "pointer",
            transition: "border-color 0.2s",
            backgroundColor: "#f8fafc"
          }}
          onClick={() => onNext("create-org")}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>🏢 Create Organization</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9em" }}>
            Start fresh with your own organization and invite team members later.
          </p>
        </div>

        <div 
          style={{ 
            border: "2px solid #e2e8f0", 
            borderRadius: 8, 
            padding: "1.5rem", 
            cursor: "pointer",
            transition: "border-color 0.2s",
            backgroundColor: "#f8fafc"
          }}
          onClick={() => onNext("join-org")}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#10b981")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>🤝 Join Organization</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9em" }}>
            Join an existing organization using an invitation code or organization name.
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateOrgStep({ user, router }: { user: any; router: any }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          user: { displayName }, 
          org: { name: orgName },
          type: "create"
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create organization");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1>Create Your Organization 🏢</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Set up your organization and workspace details.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Your Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={busy}
            placeholder="John Doe"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "1rem"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Organization Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            disabled={busy}
            placeholder="Acme Corp"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "1rem"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={busy || !displayName.trim() || !orgName.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: busy ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: "1rem",
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          {busy ? "Creating Organization..." : "Create Organization"}
        </button>

        {error && (
          <p style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

function JoinOrgStep({ user, router }: { user: any; router: any }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          user: { displayName }, 
          inviteCode: inviteCode.trim()
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to join organization");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to join organization");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1>Join Organization 🤝</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Enter your invitation code to join an existing organization.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Your Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={busy}
            placeholder="John Doe"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "1rem"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Invitation Code
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
            disabled={busy}
            placeholder="FRESH-ABC123"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #e2e8f0",
              borderRadius: 6,
              fontSize: "1rem",
              textTransform: "uppercase"
            }}
          />
          <p style={{ fontSize: "0.9em", color: "#64748b", margin: "0.5rem 0 0 0" }}>
            Ask your organization admin for the invitation code.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy || !displayName.trim() || !inviteCode.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: busy ? "#9ca3af" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontSize: "1rem",
            cursor: busy ? "not-allowed" : "pointer",
            fontWeight: 600
          }}
        >
          {busy ? "Joining Organization..." : "Join Organization"}
        </button>

        {error && (
          <p style={{ color: "#ef4444", margin: "0", textAlign: "center" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
