"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Calendar = dynamic(() => import("../../components/Calendar"), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication and get user data
    fetch("/api/session/current")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
        } else if (!data.user.onboardingComplete) {
          router.push("/onboarding");
        } else {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>Loading Dashboard...</h1>
      </div>
    );
  }

  if (!user) {
    return <div style={{ padding: 24 }}>Redirecting...</div>;
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Welcome to your Dashboard! 🎉</h1>
        <p style={{ color: "#64748b" }}>You've successfully completed onboarding.</p>
      </div>

  <div style={{ 
        display: "grid", 
        gap: "1.5rem", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" 
      }}>
        {/* User Info Card */}
        <div style={{ 
          border: "1px solid #e2e8f0", 
          borderRadius: 8, 
          padding: "1.5rem", 
          backgroundColor: "#f8fafc" 
        }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>👤 Profile</h2>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div>
              <strong>Name:</strong> {user.displayName || "Not set"}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>User ID:</strong> {user.uid}
            </div>
          </div>
        </div>

        {/* Organization Info Card */}
        <div style={{ 
          border: "1px solid #e2e8f0", 
          borderRadius: 8, 
          padding: "1.5rem", 
          backgroundColor: "#f8fafc" 
        }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>🏢 Organization</h2>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <div>
              <strong>Name:</strong> {user.orgName || "Not set"}
            </div>
            <div>
              <strong>Role:</strong> 
              <span style={{ 
                marginLeft: "0.5rem",
                padding: "0.25rem 0.5rem", 
                backgroundColor: user.role === "owner" ? "#dbeafe" : "#dcfce7",
                color: user.role === "owner" ? "#1e40af" : "#166534",
                borderRadius: 4,
                fontSize: "0.875rem",
                fontWeight: 600
              }}>
                {user.role === "owner" ? "Owner" : user.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>
            {user.orgId && (
              <div>
                <strong>Org ID:</strong> 
                <code style={{ 
                  marginLeft: "0.5rem", 
                  fontSize: "0.875rem", 
                  backgroundColor: "#f1f5f9",
                  padding: "0.25rem 0.5rem",
                  borderRadius: 4
                }}>
                  {user.orgId}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>🗓 Calendar</h2>
  <Calendar onChange={(r: { start: Date | null; end: Date | null }) => console.log("Selected range:", r)} />
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: 8 }}>
          Tip: Click any day to open a popup and pick a start/end date.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>🚀 Quick Actions</h2>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {(user.role === "owner" || user.role === "admin") && (
            <button
              onClick={() => alert("Feature coming soon! You'll be able to invite team members.")}
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              📧 Invite Members (Admins & Owners)
            </button>
          )}
          
          {/* Example of write-protected action visible only to admins/owners */}
          {(user.role === "owner" || user.role === "admin") && (
            <button
              onClick={() => alert("Write action simulated: only admins/owners can perform this.")}
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              ✏️ Create Project (Restricted)
            </button>
          )}

          <button
            onClick={() => alert("Feature coming soon! Project management tools will be here.")}
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            📊 View Projects
          </button>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to sign out?")) {
                fetch("/api/session/logout", { method: "POST" })
                  .then(() => router.push("/login"))
                  .catch(() => router.push("/login"));
              }
            }}
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Invitation Code Generator for Owners */}
  {(user.role === "owner" || user.role === "admin") && (
        <div style={{ 
          marginTop: "2rem", 
          padding: "1.5rem", 
          border: "1px solid #e2e8f0", 
          borderRadius: 8, 
          backgroundColor: "#fffbeb" 
        }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>🔑 Organization Invitation</h3>
          <p style={{ color: "#64748b", marginBottom: "1rem" }}>
            Share this invitation code with team members to join your organization:
          </p>
          <div style={{ 
            padding: "0.75rem", 
            backgroundColor: "#f1f5f9", 
            border: "1px dashed #cbd5e1",
            borderRadius: 6, 
            fontFamily: "monospace", 
            fontSize: "1.1em",
            fontWeight: "bold",
            textAlign: "center",
            color: "#1e293b"
          }}>
            {`FRESH-${(user.orgName || "ORG").toUpperCase().replace(/\s+/g, "_")}-${(user.orgId || "000000").slice(-6)}`}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
            <CopyInviteButton 
              code={`FRESH-${(user.orgName || "ORG").toUpperCase().replace(/\s+/g, "_")}-${(user.orgId || "000000").slice(-6)}`}
            />
          </div>
          <p style={{ color: "#64748b", fontSize: "0.9em", marginTop: "0.5rem" }}>
            Team members can use this code on the "Join Organization" page during onboarding.
          </p>
        </div>
      )}
    </main>
  );
}

function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      // Try Clipboard API first
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers or contexts with blocked Clipboard API
      try {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert('Copy failed. Please copy the code manually.');
      }
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "0.5rem 0.75rem",
        backgroundColor: copied ? "#22c55e" : "#334155",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {copied ? "Copied!" : "Copy Code"}
    </button>
  );
}
