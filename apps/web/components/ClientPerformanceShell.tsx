'use client';

import React, { useEffect } from 'react';

// Simple performance provider without external dependencies
function SimplePerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run in browser and production
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    // Safe performance monitoring
    try {
      // Add basic resource hints
      const origins = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

      origins.forEach(origin => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    } catch (error) {
      console.warn('Performance setup failed:', error);
    }
  }, []);

  return <>{children}</>;
}

// Simple budget checker for development
function SimpleBudgetChecker() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    // Check bundle sizes after load
    const checkBudgets = () => {
      try {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        const jsSize = resources
          .filter(r => r.name.includes('.js') && !r.name.includes('webpack'))
          .reduce((total, r) => total + (r.transferSize || 0), 0);

        if (jsSize > 250 * 1024) {
          console.warn(
            `⚠️ JS bundle size exceeded budget: ${(jsSize / 1024).toFixed(2)} KB > 250 KB`
          );
        }
      } catch (error) {
        console.warn('Budget check failed:', error);
      }
    };

    window.addEventListener('load', () => {
      setTimeout(checkBudgets, 1000);
    });
  }, []);

  return null;
}

export function ClientPerformanceShell({ children }: { children: React.ReactNode }) {
  return (
    <SimplePerformanceProvider>
      <SimpleBudgetChecker />
      {children}
    </SimplePerformanceProvider>
  );
}

export default ClientPerformanceShell;
