import { getServerSession } from "@/lib/session";

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Fresh",
  description: "Authentication + Onboarding + Scheduling Platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const loggedIn = !!session?.sub;
  const onboarded = !!session?.onboardingComplete;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Fresh";

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body style={{ fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell", margin: 0 }}>
        {/* Global Header / Navigation */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <nav style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <a href={loggedIn && onboarded ? "/dashboard" : "/"} style={{
                color: "#111827", fontWeight: 800, textDecoration: "none", fontSize: 18
              }}>{appName}</a>
              {loggedIn && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <a href="/dashboard" style={{ color: "#374151", textDecoration: "none", fontSize: 14 }}>Dashboard</a>
                  {!onboarded && (
                    <a href="/onboarding" style={{ color: "#374151", textDecoration: "none", fontSize: 14 }}>Onboarding</a>
                  )}
                  <a href="/team" style={{ color: "#374151", textDecoration: "none", fontSize: 14 }}>Team</a>
                  <a href="/calendar" style={{ color: "#374151", textDecoration: "none", fontSize: 14 }}>Calendar</a>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {loggedIn ? (
                <>
                  {session?.role && (
                    <span style={{
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #bfdbfe",
                      borderRadius: 9999,
                      padding: "4px 10px",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.5
                    }}>{session.role}</span>
                  )}
                  <a href="/api/session/logout" style={{
                    color: "#374151",
                    backgroundColor: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    padding: "6px 12px",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontSize: 14
                  }}>Sign out</a>
                </>
              ) : (
                <>
                  <a href="/login" style={{ color: "#374151", textDecoration: "none", fontSize: 14 }}>Login</a>
                  <a href="/register" style={{
                    color: "white", backgroundColor: "#2563eb",
                    padding: "6px 12px", borderRadius: 8,
                    textDecoration: "none", fontSize: 14
                  }}>Sign up</a>
                </>
              )}
            </div>
          </nav>
        </header>

        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>{children}</div>
        </div>
        <script dangerouslySetInnerHTML={{__html: 'if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));}'}} />
      </body>
    </html>
  );
}
