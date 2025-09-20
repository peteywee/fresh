'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { type User, onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/lib/firebase.client';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, user => {
      setLoading(false);
      if (user) {
        setUser(user);
      } else {
        router.replace('/');
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', fontSize: 14 }}>
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', fontSize: 14 }}>
        Redirecting to login...
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
            Welcome back, {user.displayName || user.email}! 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16 }}>
            Here's what's happening with your schedule today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={
              user.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=random`
            }
            alt="Profile"
            style={{ width: 40, height: 40, borderRadius: '50%' }}
          />
          <button
            onClick={() => {
              auth?.signOut();
              router.replace('/');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Sign Out
          </button>
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
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Today's Schedule
          </h3>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#059669', marginBottom: 4 }}>0</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>events scheduled</p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            This Week
          </h3>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>0</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>total events</p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Pending
          </h3>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>0</p>
          <p style={{ fontSize: 14, color: '#6b7280' }}>requests</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>
            Recent Activity
          </h2>
        </div>
        <div style={{ padding: 24 }}>
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: '#6b7280',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
              No recent activity
            </h3>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              Your schedule activity will appear here once you start creating events.
            </p>
            <button
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Create First Event
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
