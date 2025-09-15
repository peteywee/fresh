'use client';

import { useState } from 'react';

export default function OnboardingClient() {
  const [displayName, setDisplayName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');

  async function complete() {
    const r = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        user: { email, displayName },
        org: { name: orgName },
      }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert('Onboarding failed: ' + (d.error ?? r.statusText));
      return;
    }
    window.location.href = '/dashboard';
  }

  return (
    <main>
      <h1>Onboarding</h1>
      <p>Create your organization and finalize your profile.</p>
      <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <label>
          Name
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Jane Doe"
          />
        </label>
        <label>
          Email
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jane@example.com"
          />
        </label>
        <label>
          Organization
          <input
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="Acme, Inc."
          />
        </label>
        <button onClick={complete} style={{ padding: '8px 16px' }}>
          Complete
        </button>
      </div>
    </main>
  );
}
