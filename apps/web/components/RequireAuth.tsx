'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { type User, onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/lib/firebase.client';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', fontSize: 14 }}>
        Checking session…
      </div>
    );
  }

  if (!user) return null; // redirected

  return <>{children}</>;
}
