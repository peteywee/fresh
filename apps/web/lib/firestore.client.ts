'use client';

import { Timestamp, addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';

import { app, auth } from '@/lib/firebase.client';

let db: ReturnType<typeof getFirestore> | null = null;

if (app) {
  db = getFirestore(app);
}

export { db };

export type NewEvent = {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  notes?: string;
};

export type EventDoc = {
  uid: string;
  title: string;
  startISO: string; // ISO datetime
  endISO: string; // ISO datetime
  notes?: string;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
};

export function toISO(date: string, time: string): string {
  // Combines local date + time to ISO; assumes user's local timezone.
  // For production, store timezone or normalize to UTC as needed.
  const dt = new Date(`${date}T${time}`);
  if (Number.isNaN(dt.valueOf())) throw new Error('invalid_datetime');
  return dt.toISOString();
}

export async function createEvent(input: NewEvent): Promise<string> {
  if (!auth) throw new Error('auth/not-initialized');
  if (!db) throw new Error('firestore/not-initialized');

  const user = auth.currentUser;
  if (!user) throw new Error('auth/required');

  const doc: EventDoc = {
    uid: user.uid,
    title: input.title.trim(),
    startISO: toISO(input.date, input.startTime),
    endISO: toISO(input.date, input.endTime),
    notes: input.notes?.trim() || undefined,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'users', user.uid, 'events'), doc);
  return ref.id;
}
