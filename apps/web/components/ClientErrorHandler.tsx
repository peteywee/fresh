'use client';

import { useEffect } from 'react';

export default function ClientErrorHandler() {
  useEffect(() => {
    // Catch unhandled JavaScript errors
    const handleError = (event: ErrorEvent) => {
      const errorData = {
        type: 'javascript-error',
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      console.error('JavaScript Error Caught:', errorData);

      // Send to error tracking endpoint
      fetch('/api/error-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(err => console.error('Failed to report error:', err));
    };

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorData = {
        type: 'unhandled-promise-rejection',
        reason: event.reason?.toString() || 'Unknown rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      console.error('Unhandled Promise Rejection:', errorData);

      // Send to error tracking endpoint
      fetch('/api/error-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(err => console.error('Failed to report error:', err));
    };

    // Catch fetch/network errors that might result in 500s
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Log 500 errors
        if (response.status >= 500) {
          const errorData = {
            type: 'http-500-error',
            url: args[0]?.toString() || 'unknown',
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: window.location.href,
          };

          console.error('HTTP 500 Error Detected:', errorData);

          // Send to error tracking endpoint (use original fetch to avoid recursion)
          originalFetch('/api/error-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorData),
          }).catch(err => console.error('Failed to report 500 error:', err));
        }

        return response;
      } catch (error) {
        // Network errors
        const errorData = {
          type: 'network-error',
          url: args[0]?.toString() || 'unknown',
          message: error instanceof Error ? error.message : 'Network error',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: window.location.href,
        };

        console.error('Network Error:', errorData);

        // Send to error tracking endpoint
        originalFetch('/api/error-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        }).catch(err => console.error('Failed to report network error:', err));

        throw error;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      // Cleanup
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.fetch = originalFetch;
    };
  }, []);

  return null; // This component doesn't render anything
}
