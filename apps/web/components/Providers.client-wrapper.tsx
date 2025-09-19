'use client';

import React from 'react';
import ProvidersSafe from './Providers.safe';

export default function ProvidersClient(
  props: React.PropsWithChildren<{ initialIndustry?: string }>
) {
  return <ProvidersSafe {...props} />;
}
