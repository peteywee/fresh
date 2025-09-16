'use client';

import { useEffect, useState } from 'react';

interface Health {
  ok: boolean;
  projectId?: string;
  auth?: boolean;
  db?: boolean;
  error?: string;
}

export default function AdminHealthPage() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin-health');
        const json = (await res.json()) as Health;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setData({ ok: false, error: e.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 640 }}>
      <h1>Firebase Admin Health</h1>
      <p style={{ color: '#666' }}>Dev-only diagnostic page. Remove before production deploy.</p>
      {loading && <p>Loading...</p>}
      {!loading && data && (
        <pre
          style={{
            background: '#111',
            color: data.ok ? '#c2f5d5' : '#f8c2c2',
            padding: '1rem',
            borderRadius: 8,
            overflowX: 'auto',
            fontSize: 14,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      <section style={{ marginTop: '2rem' }}>
        <h2>Troubleshooting</h2>
        <ul style={{ lineHeight: 1.5 }}>
          <li>Check .env.local has FIREBASE_SERVICE_ACCOUNT_KEY_PATH or inline credentials.</li>
          <li>If using a key file, ensure path is correct relative to repo root.</li>
          <li>Restart dev after editing .env.local.</li>
          <li>Verify private key newlines are escaped if inline.</li>
        </ul>
      </section>
    </div>
  );
}
