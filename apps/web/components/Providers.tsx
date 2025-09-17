'use client';

import { BrandingProvider } from '@/lib/useBranding';

interface ProvidersProps {
  children: React.ReactNode;
  initialIndustry?: string;
}

export function Providers({ children, initialIndustry }: ProvidersProps) {
  return <BrandingProvider initialIndustry={initialIndustry}>{children}</BrandingProvider>;
}
