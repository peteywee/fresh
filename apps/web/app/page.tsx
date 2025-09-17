'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import RequireAuth from '@/components/RequireAuth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users directly to dashboard
    router.replace('/dashboard');
  }, [router]);

  return (
    <RequireAuth>
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', fontSize: 14 }}>
        Redirecting to dashboard...
      </div>
    </RequireAuth>
  );
}
