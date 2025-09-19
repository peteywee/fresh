'use client';

import React from 'react';

// Dynamically import the Providers module and select named or default export.
// If neither is a callable component, throw a clear error.
export default async function ProvidersSafe(
  props: React.PropsWithChildren<{ initialIndustry?: string }>
) {
  const mod: any = await import('./Providers');
  const Impl = mod?.Providers ?? mod?.default;
  if (typeof Impl !== 'function') {
    throw new Error(
      "[Providers.safe] Export not found. Expected named export 'Providers' or a default export from '@/components/Providers'."
    );
  }
  return <Impl {...props} />;
}
