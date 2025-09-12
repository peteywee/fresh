import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function Dashboard() {
  const session = await getServerSession();
  
  if (!session?.sub) {
    return redirect("/login");
  }
  
  if (!session.onboardingComplete) {
    return redirect("/onboarding");
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 32,
        paddingBottom: 16,
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            Welcome back, {session.displayName || "User"}! 👋
          </h1>
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            {session.orgName && (
              <span>
                <strong>{session.orgName}</strong> • {session.role || "member"}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a 
            href="/api/session/logout" 
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500
            }}
          >
            Sign Out
          </a>
        </div>
      </header>

      {/* Quick Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: 24, 
        marginBottom: 32 
      }}>
        <div style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
            🗓️ Today's Schedule
          </h3>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>No meetings scheduled</p>
          <a href="/calendar" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
            View Calendar →
          </a>
        </div>
        
        <div style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
            👥 Team Members
          </h3>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>
            {session.role === "owner" ? "You're the organization owner" : "Member of the team"}
          </p>
          <a href="/team" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
            Manage Team →
          </a>
        </div>
        
        <div style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
            📊 Quick Actions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="/schedule/new" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
              + Schedule Meeting
            </a>
            <a href="/projects/new" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
              + Create Project
            </a>
            <a href="/settings" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
              ⚙️ Settings
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: "white",
        padding: 24,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
          Recent Activity
        </h2>
        <div style={{ color: "#6b7280", textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <p>No recent activity yet.</p>
          <p style={{ fontSize: 14 }}>
            Start by scheduling a meeting or creating a project to see activity here.
          </p>
        </div>
      </div>
    </main>
  );
}
