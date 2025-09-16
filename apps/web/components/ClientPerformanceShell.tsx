'use client';

import React from 'react';
import { PerformanceProvider, PerformanceBudget } from '@/components/PerformanceProvider';

export function ClientPerformanceShell({ children }: { children: React.ReactNode }) {
  return (
    <PerformanceProvider>
      <PerformanceBudget />
      {children}
    </PerformanceProvider>
  );
}

export default ClientPerformanceShell;