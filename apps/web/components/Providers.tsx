'use client';

import React from 'react';

type ProvidersProps = {
  children: React.ReactNode;
  initialIndustry?: string;
};

export function Providers({ children }: ProvidersProps) {
  // Temporarily simplified - just pass through children
  // TODO: Re-add BrandingProvider after fixing the core import issue
  return <>{children}</>;
}
