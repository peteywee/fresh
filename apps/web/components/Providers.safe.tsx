'use client';

import React from 'react';

import dynamic from 'next/dynamic';

// Use Next.js dynamic import with proper error handling
const Providers = dynamic<{ children: React.ReactNode }>(
  () => import('./Providers').then(m => ({ default: m.Providers })),
  {
    loading: () => <div className="providers-loading">Loading...</div>,
    ssr: false,
  }
);

export default function ProvidersSafe({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<FallbackProvider>{children}</FallbackProvider>}>
      <Providers>{children}</Providers>
    </React.Suspense>
  );
}

function FallbackProvider({ children }: { children: React.ReactNode }) {
  return <div className="providers-fallback">{children}</div>;
}
