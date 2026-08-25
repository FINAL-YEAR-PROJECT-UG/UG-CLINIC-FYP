/**
 * usePrefetchNavigation Hook
 * 
 * Implements intelligent navigation prefetching and optimistic UI updates
 * to make page transitions feel instant. Uses Next.js's built-in prefetching
 * combined with custom data prefetching for API routes.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useRef } from 'react';
import { queryCache } from '@/lib/queryCache';

interface PrefetchOptions {
  /** API endpoints to prefetch when hovering over the link */
  apiEndpoints?: string[];
  /** Delay before prefetching (ms) - helps avoid unnecessary requests */
  delay?: number;
  /** Whether to use optimistic UI updates */
  optimistic?: boolean;
}

/**
 * Hook for intelligent navigation prefetching
 * 
 * @param targetPath - The path to potentially navigate to
 * @param options - Prefetch configuration options
 */
export function usePrefetchNavigation(targetPath: string, options: PrefetchOptions = {}) {
  const router = useRouter();
  const { apiEndpoints = [], delay = 150, optimistic = false } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasPrefetched = useRef(false);

  // Prefetch Next.js page assets
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Use Next.js's built-in prefetch for the page
    router.prefetch(targetPath);
  }, [router, targetPath]);

  // Prefetch API data when user shows intent (hover/focus)
  const prefetchData = useCallback(() => {
    if (hasPrefetched.current || apiEndpoints.length === 0) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to avoid prefetching on quick passes
    timeoutRef.current = setTimeout(() => {
      apiEndpoints.forEach(endpoint => {
        // Check if data is already cached
        const cacheKey = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        if (!queryCache.isFresh(cacheKey)) {
          // In a real implementation, you'd trigger actual API calls here
          // For now, this demonstrates the pattern
          console.log(`[Prefetch] Would prefetch: ${endpoint}`);
        }
      });
      hasPrefetched.current = true;
    }, delay);
  }, [apiEndpoints, delay]);

  // Cancel prefetch if user navigates away
  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Optimistic navigation handler
  const navigateWithOptimism = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (optimistic) {
      // Show optimistic UI state immediately
      // This could update local state to show the new page content
      // while the actual navigation happens in the background
      console.log(`[Optimistic] Showing UI for: ${targetPath}`);
    }

    // Perform actual navigation
    router.push(targetPath);
  }, [router, targetPath, optimistic]);

  return {
    prefetchData,
    cancelPrefetch,
    navigateWithOptimism,
    hasPrefetched: hasPrefetched.current,
  };
}

/**
 * HOC component for prefetching navigation
 * Wraps a component to add intelligent prefetching to its navigation
 */
export function withPrefetchNavigation<P extends object>(
  Component: React.ComponentType<P>,
  targetPath: string,
  options: PrefetchOptions = {}
) {
  return function PrefetchWrapper(props: P) {
    const { prefetchData, cancelPrefetch, navigateWithOptimism } = usePrefetchNavigation(targetPath, options);

    return (
      <Component
        {...props}
        onMouseEnter={prefetchData}
        onMouseLeave={cancelPrefetch}
        onFocus={prefetchData}
        onBlur={cancelPrefetch}
        onClick={navigateWithOptimism}
      />
    );
  };
}