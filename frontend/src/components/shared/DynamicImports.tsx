/**
 * Dynamic Imports Configuration
 * 
 * This file exports dynamically imported components to enable code splitting
 * and reduce initial bundle size. Heavy components are loaded only when needed.
 */

import dynamic from 'next/dynamic';
import React, { useState, useCallback } from 'react';

// Loading component for dynamic imports
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Error component for dynamic imports
export const ErrorFallback = ({ error }: { error?: Error }) => (
  <div className="p-4 text-center text-red-600">
    <p>Failed to load component</p>
    {error && <p className="text-sm mt-1">{error.message}</p>}
  </div>
);

// ── AI Components ─────────────────────────────────────────────────────────────

/**
 * Dynamic import for Staff AI Sidebar
 */
export const StaffAiSidebar = dynamic(
  () => import('@/components/shared/StaffAiSidebar'),
  {
    ssr: false,
    loading: () => null,
  }
);

// ── Hook for lazy loading components with prefetch ─────────────────────────────

/**
 * Custom hook to lazy load components with prefetch on hover
 */
export function useLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (Component) return Component;
    
    setLoading(true);
    setError(null);
    
    try {
      const mod = await importFn();
      setComponent(mod.default);
      return mod.default;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [importFn, Component]);

  const prefetch = useCallback(() => {
    // Prefetch without showing loading state
    void load();
  }, [load]);

  return { Component, loading, error, load, prefetch };
}