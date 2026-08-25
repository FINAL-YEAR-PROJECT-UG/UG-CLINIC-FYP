/**
 * useInfiniteScroll Hook
 * 
 * Implements infinite scroll functionality for paginated data.
 * Automatically loads more data as the user scrolls down the page.
 * Can be used alongside traditional pagination or as a replacement.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface InfiniteScrollOptions<T> {
  /** Function to fetch data for a specific page */
  fetchPage: (page: number, pageSize: number) => Promise<{ items: T[]; total: number; hasMore: boolean }>;
  /** Number of items per page */
  pageSize?: number;
  /** Initial page number */
  initialPage?: number;
  /** Threshold (in pixels) from bottom before triggering load more */
  threshold?: number;
  /** Whether infinite scroll is enabled */
  enabled?: boolean;
  /** Unique key for the scroll observer (useful for multiple scroll containers) */
  observerKey?: string;
}

interface InfiniteScrollResult<T> {
  /** All loaded items */
  items: T[];
  /** Current page number */
  currentPage: number;
  /** Total number of items available */
  total: number;
  /** Whether more items can be loaded */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Whether initial load is in progress */
  isInitialLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Function to load next page */
  loadNextPage: () => Promise<void>;
  /** Function to reset and reload from page 1 */
  reset: () => Promise<void>;
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Ref to attach to the sentinel element at bottom */
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>({
  fetchPage,
  pageSize = 10,
  initialPage = 1,
  threshold = 200,
  enabled = true,
  observerKey = 'default',
}: InfiniteScrollOptions<T>): InfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Expose sentinelRef for external components
  useEffect(() => {
    // This effect runs to ensure the ref is stable
  }, []);

  // Load a specific page
  const loadPage = useCallback(async (page: number, append = false) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchPage(page, pageSize);

      if (append) {
        setItems(prev => [...prev, ...result.items]);
      } else {
        setItems(result.items);
      }

      setTotal(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [fetchPage, pageSize, isLoading]);

  // Load next page
  const loadNextPage = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadPage(currentPage + 1, true);
  }, [currentPage, hasMore, isLoading, loadPage]);

  // Reset and reload from page 1
  const reset = useCallback(async () => {
    setCurrentPage(initialPage);
    setItems([]);
    setHasMore(true);
    setError(null);
    setIsInitialLoading(true);
    await loadPage(initialPage, false);
  }, [initialPage, loadPage]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          void loadNextPage();
        }
      },
      {
        root: containerRef.current || null,
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, isLoading, loadNextPage, threshold, observerKey]);

  // Initial load
  useEffect(() => {
    if (enabled && items.length === 0 && isInitialLoading) {
      void loadPage(initialPage, false);
    }
  }, [enabled, initialPage, loadPage, items.length, isInitialLoading]);

  return {
    items,
    currentPage,
    total,
    hasMore,
    isLoading,
    isInitialLoading,
    error,
    loadNextPage,
    reset,
    containerRef,
    sentinelRef,
  };
}

/**
 * InfiniteScrollSentinel component
 * Place this at the bottom of your scrollable content to trigger loading more items
 * Pass the sentinelRef from useInfiniteScroll to this component
 */
interface InfiniteScrollSentinelProps {
  sentinelRef: React.RefObject<HTMLDivElement>;
  className?: string;
  isLoading?: boolean;
}

export function InfiniteScrollSentinel({ 
  sentinelRef, 
  className = '',
  isLoading = false 
}: InfiniteScrollSentinelProps) {
  return (
    <div 
      ref={sentinelRef} 
      className={`w-full h-1 flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {isLoading && (
        <div className="py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}