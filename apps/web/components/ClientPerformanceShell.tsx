'use client';

import React from 'react';

import { PerformanceBudget, PerformanceProvider } from '@/components/PerformanceProvider';

export function ClientPerformanceShell({ children }: { children: React.ReactNode }) {
  return (
    <PerformanceProvider>
      <PerformanceBudget />
      {children}
    </PerformanceProvider>
  );
}

export default ClientPerformanceShell;
