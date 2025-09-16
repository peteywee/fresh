import { getServerSession } from '@/lib/session';

async function fetchPending(): Promise<any[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/schedules?pending=1`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.schedules || [];
  } catch {
    return [];
  }
}

export default async function Dashboard() {
  const session = await getServerSession();
  const pending = await fetchPending();

  // If we reach this page, middleware has already verified auth/onboarding
  // Just get session data for display purposes
  if (!session?.sub) {
    // This should not happen due to middleware, but handle gracefully
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Session error - please try logging in again.</p>
        <a href="/login">Go to Login</a>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          paddingBottom: 16,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            Welcome back, {session.displayName || 'User'}! 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>
            {session.orgName && (
              <span>
                <strong>{session.orgName}</strong> • {session.role || 'member'}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a
            href="/api/session/logout"
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Sign Out
          </a>
        </div>
      </header>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            🗓️ Today's Schedule
          </h3>
          <p style={{ color: '#6b7280', marginBottom: 16 }}>No meetings scheduled</p>
          <a href="/calendar" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
            View Calendar →
          </a>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            👥 Team Members
          </h3>
          <p style={{ color: '#6b7280', marginBottom: 16 }}>
            {session.role === 'owner' ? "You're the organization owner" : 'Member of the team'}
          </p>
          <a href="/team" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
            Manage Team →
          </a>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            📊 Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a
              href="/schedule/new"
              style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}
            >
              + Schedule Meeting
            </a>
            <a
              href="/projects/new"
              style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}
            >
              + Create Project
            </a>
            <a href="/settings" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14 }}>
              ⚙️ Settings
            </a>
          </div>
        </div>
      </div>

      {/* Pending Confirmations */}
      {pending.length > 0 && (
        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>
            Pending Confirmations
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {pending.slice(0, 5).map(item => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {item.title || 'Untitled'}
                  </div>
                  {item.start && (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(item.start).toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <form
                    action={`/api/schedules/${item.id}/confirm`}
                    method="post"
                    style={{ margin: 0 }}
                  >
                    <button
                      formMethod="patch"
                      style={{
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Confirm
                    </button>
                  </form>
                  <form
                    action={`/api/schedules/${item.id}/decline`}
                    method="post"
                    style={{
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      maxWidth: 240,
                    }}
                  >
                    <textarea
                      name="reason"
                      placeholder="Optional reason"
                      rows={2}
                      style={{
                        resize: 'vertical',
                        padding: 6,
                        fontSize: 12,
                        borderRadius: 4,
                        border: '1px solid #d1d5db',
                        fontFamily: 'inherit',
                      }}
                    />
                    <button
                      formMethod="patch"
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div
        style={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
          Recent Activity
        </h2>
        <div style={{ color: '#6b7280', textAlign: 'center', padding: 32 }}>
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
