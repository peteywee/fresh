'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/lib/firebase.client';
import { type NewEvent, createEvent } from '@/lib/firestore.client';

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<NewEvent>({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okId, setOkId] = useState<string | null>(null);

  // Lightweight guard: if user is signed out while here, kick back to /login
  // (Keeps MVP simple; you can wrap the whole page with your RequireAuth later)
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) router.replace('/login');
    });
    return () => unsub();
  }, [router]);

  function update<K extends keyof NewEvent>(key: K, value: NewEvent[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.title.trim()) return 'Title is required';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return 'Date is required (YYYY-MM-DD)';
    if (!/^\d{2}:\d{2}$/.test(form.startTime)) return 'Start time is required (HH:MM)';
    if (!/^\d{2}:\d{2}$/.test(form.endTime)) return 'End time is required (HH:MM)';
    // naive range check
    if (form.startTime >= form.endTime) return 'End time must be after start time';
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const v = validate();
    if (v) return setErr(v);
    try {
      setBusy(true);
      const id = await createEvent(form);
      setOkId(id);
      // redirect back home after a short pause
      setTimeout(() => router.replace('/'), 700);
    } catch (e: any) {
      setErr(e?.message || 'Failed to create event');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '3rem auto', padding: '0 1rem' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Create Event</h1>
      <p style={{ color: '#4b5563', marginBottom: 16 }}>
        Add the basics now; you can refine later.
      </p>

      <form
        onSubmit={submit}
        style={{
          display: 'grid',
          gap: 12,
          border: '1px solid #e5e7eb',
          padding: 16,
          borderRadius: 12,
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Title</span>
          <input
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            placeholder="Team standup"
            style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          />
        </label>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Date</span>
            <input
              type="date"
              value={form.date}
              onChange={e => update('date', e.target.value)}
              required
              style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Start</span>
            <input
              type="time"
              value={form.startTime}
              onChange={e => update('startTime', e.target.value)}
              required
              style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>End</span>
            <input
              type="time"
              value={form.endTime}
              onChange={e => update('endTime', e.target.value)}
              required
              style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </label>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Notes (optional)</span>
          <textarea
            rows={4}
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Agenda, links, etc."
            style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#111827',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
            }}
          >
            {busy ? 'Creating…' : 'Create event'}
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              background: '#fff',
              textDecoration: 'none',
              color: '#111827',
            }}
          >
            Cancel
          </Link>
        </div>

        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}
        {okId && <p style={{ color: '#065f46' }}>Saved! (#{okId})</p>}
      </form>
    </main>
  );
}
