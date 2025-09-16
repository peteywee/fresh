'use client';

import { useEffect } from 'react';

import { PerformanceMonitor, addCriticalResourceHints, trackBundleSize } from '@/lib/performance';

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Initialize performance monitoring
      const monitor = PerformanceMonitor.getInstance();
      monitor.init();

      // Add critical resource hints
      addCriticalResourceHints();

      // Track bundle sizes after load
      window.addEventListener('load', () => {
        setTimeout(trackBundleSize, 1000);
      });
    }
  }, []);

  return <>{children}</>;
}

// Performance budget warnings (development only)
export function PerformanceBudget() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const checkBudgets = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      const jsSize = resources
        .filter(r => r.name.includes('.js') && !r.name.includes('webpack'))
        .reduce((total, r) => total + (r.transferSize || 0), 0);

      const cssSize = resources
        .filter(r => r.name.includes('.css'))
        .reduce((total, r) => total + (r.transferSize || 0), 0);

      // Performance budgets (in bytes)
      const BUDGETS = {
        js: 250 * 1024, // 250 KB
        css: 50 * 1024, // 50 KB
        total: 300 * 1024, // 300 KB
      };

      if (jsSize > BUDGETS.js) {
        console.warn(
          `⚠️ JS bundle size exceeded budget: ${(jsSize / 1024).toFixed(2)} KB > ${(BUDGETS.js / 1024).toFixed(2)} KB`
        );
      }

      if (cssSize > BUDGETS.css) {
        console.warn(
          `⚠️ CSS bundle size exceeded budget: ${(cssSize / 1024).toFixed(2)} KB > ${(BUDGETS.css / 1024).toFixed(2)} KB`
        );
      }

      const totalSize = jsSize + cssSize;
      if (totalSize > BUDGETS.total) {
        console.warn(
          `⚠️ Total bundle size exceeded budget: ${(totalSize / 1024).toFixed(2)} KB > ${(BUDGETS.total / 1024).toFixed(2)} KB`
        );
      }

      // Check Core Web Vitals
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
        const lcp = performance.getEntriesByType('largest-contentful-paint').pop()?.startTime;

        if (fcp && fcp > 1800) {
          console.warn(`⚠️ First Contentful Paint too slow: ${fcp.toFixed(2)} ms > 1800 ms`);
        }

        if (lcp && lcp > 2500) {
          console.warn(`⚠️ Largest Contentful Paint too slow: ${lcp.toFixed(2)} ms > 2500 ms`);
        }

        const totalLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        if (totalLoadTime > 3000) {
          console.warn(`⚠️ Page load time too slow: ${totalLoadTime.toFixed(2)} ms > 3000 ms`);
        }
      }, 2000);
    };

    window.addEventListener('load', () => {
      setTimeout(checkBudgets, 1000);
    });
  }, []);

  return null;
}
