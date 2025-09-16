'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
}

// Cache for GET requests
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFetch<T = any>(
  url: string | null,
  options: FetchOptions = {},
  deps: any[] = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    // Check cache for GET requests
    if (!options.method || options.method === 'GET') {
      const cached = cache.get(url);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Cache GET requests
      if (!options.method || options.method === 'GET') {
        cache.set(url, {
          data: result,
          timestamp: Date.now(),
          ttl: CACHE_TTL,
        });
      }

      setData(result);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [url, options.method, options.body, ...deps]);

  const mutate = useCallback(
    (newData: T) => {
      setData(newData);
      if (url) {
        // Update cache
        cache.set(url, {
          data: newData,
          timestamp: Date.now(),
          ttl: CACHE_TTL,
        });
      }
    },
    [url]
  );

  const refetch = useCallback(async () => {
    if (url) {
      // Clear cache for this URL
      cache.delete(url);
      await fetchData();
    }
  }, [url, fetchData]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch, mutate };
}

// Debounced version for search/filter operations
export function useDebouncedFetch<T = any>(
  url: string | null,
  options: FetchOptions = {},
  delay: number = 300,
  deps: any[] = []
): UseFetchResult<T> {
  const [debouncedUrl, setDebouncedUrl] = useState(url);
  const [debouncedOptions, setDebouncedOptions] = useState(options);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUrl(url);
      setDebouncedOptions(options);
    }, delay);

    return () => clearTimeout(timer);
  }, [url, options, delay]);

  return useFetch<T>(debouncedUrl, debouncedOptions, deps);
}

// Optimistic updates for mutations
export function useOptimisticMutation<T = any>(url: string, options: FetchOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      optimisticData: T,
      actualData?: any,
      onSuccess?: (data: T) => void,
      onError?: (error: string) => void
    ) => {
      setLoading(true);
      setError(null);

      // Apply optimistic update immediately
      if (onSuccess) {
        onSuccess(optimisticData);
      }

      try {
        const response = await fetch(url, {
          ...options,
          method: options.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(actualData || optimisticData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        // Update with actual server response
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        if (onError) {
          onError(err.message);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, options]
  );

  return { mutate, loading, error };
}

// Clear cache utility
export function clearCache(pattern?: string) {
  if (pattern) {
    const keys = Array.from(cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  } else {
    cache.clear();
  }
}

// Preload data utility
export function preloadData(url: string, options: FetchOptions = {}) {
  // Only preload GET requests
  if (options.method && options.method !== 'GET') return;

  fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
    .then(response => response.json())
    .then(data => {
      cache.set(url, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      });
    })
    .catch(() => {
      // Silently fail preloading
    });
}
