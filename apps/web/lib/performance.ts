// Performance utilities for the Fresh app
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Core Web Vitals tracking
  measureCLS(): void {
    if (typeof window === 'undefined') return;
    
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          console.log('CLS:', (entry as any).value);
          this.metrics.set('cls', (entry as any).value);
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }

  measureFID(): void {
    if (typeof window === 'undefined') return;
    
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log('FID:', (entry as any).processingStart - (entry as any).startTime);
        this.metrics.set('fid', (entry as any).processingStart - (entry as any).startTime);
      }
    }).observe({ type: 'first-input', buffered: true });
  }

  measureLCP(): void {
    if (typeof window === 'undefined') return;
    
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
      this.metrics.set('lcp', lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }

  // Custom timing measurements
  startTiming(name: string): void {
    if (typeof window === 'undefined') return;
    performance.mark(`${name}-start`);
  }

  endTiming(name: string): number {
    if (typeof window === 'undefined') return 0;
    
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    const duration = measure.duration;
    
    console.log(`${name}:`, duration, 'ms');
    this.metrics.set(name, duration);
    
    return duration;
  }

  // Navigation timing
  getNavigationTimings(): Record<string, number> {
    if (typeof window === 'undefined') return {};
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart,
    };
  }

  // Resource timing
  getResourceTimings(): Array<{ name: string; duration: number; size?: number }> {
    if (typeof window === 'undefined') return [];
    
    return performance.getEntriesByType('resource').map((entry: any) => ({
      name: entry.name,
      duration: entry.duration,
      size: entry.transferSize || entry.decodedBodySize || 0,
    }));
  }

  // Memory usage (Chrome only)
  getMemoryUsage(): Record<string, number> | null {
    if (typeof window === 'undefined') return null;
    
    const memory = (performance as any).memory;
    if (!memory) return null;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  // Send metrics to analytics (implement your preferred service)
  sendMetrics(): void {
    const allMetrics = {
      coreWebVitals: {
        cls: this.metrics.get('cls'),
        fid: this.metrics.get('fid'),
        lcp: this.metrics.get('lcp'),
      },
      navigation: this.getNavigationTimings(),
      memory: this.getMemoryUsage(),
      custom: Object.fromEntries(this.metrics.entries()),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Send to your analytics service
    console.log('Performance Metrics:', allMetrics);
    
    // Example: send to Google Analytics
    // gtag('event', 'performance', allMetrics);
    
    // Example: send to custom endpoint
    // fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(allMetrics),
    // });
  }

  // Initialize all measurements
  init(): void {
    if (typeof window === 'undefined') return;
    
    this.measureCLS();
    this.measureFID();
    this.measureLCP();
    
    // Send metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.sendMetrics(), 1000);
    });
  }
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  const startTiming = (name: string) => monitor.startTiming(name);
  const endTiming = (name: string) => monitor.endTiming(name);
  
  return { startTiming, endTiming };
}

// Resource preloading utilities
export function preloadResource(href: string, as: string, crossorigin?: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = crossorigin;
  
  document.head.appendChild(link);
}

export function prefetchResource(href: string): void {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  
  document.head.appendChild(link);
}

// Intersection Observer for lazy loading
export function createLazyLoader(callback: (entry: IntersectionObserverEntry) => void) {
  if (typeof window === 'undefined') return null;
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    { rootMargin: '50px' }
  );
}

// Image optimization utilities
export function optimizeImageSrc(src: string, width?: number, height?: number, quality = 75): string {
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  
  // For Next.js Image optimization
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  
  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
}

// Critical resource hints
export function addCriticalResourceHints(): void {
  if (typeof document === 'undefined') return;
  
  // Preconnect to essential origins
  const origins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];
  
  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Bundle size tracking
export function trackBundleSize(): void {
  if (typeof window === 'undefined') return;
  
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const jsSize = resources
    .filter(r => r.name.includes('.js'))
    .reduce((total, r) => total + (r.transferSize || 0), 0);
    
  const cssSize = resources
    .filter(r => r.name.includes('.css'))
    .reduce((total, r) => total + (r.transferSize || 0), 0);
  
  console.log('Bundle sizes:', {
    js: `${(jsSize / 1024).toFixed(2)} KB`,
    css: `${(cssSize / 1024).toFixed(2)} KB`,
    total: `${((jsSize + cssSize) / 1024).toFixed(2)} KB`,
  });
}