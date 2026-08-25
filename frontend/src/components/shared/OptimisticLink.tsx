/**
 * OptimisticLink Component
 * 
 * An enhanced Link component that provides:
 * - Intelligent prefetching of page assets and API data
 * - Optimistic UI updates for instant navigation feel
 * - Loading states with skeleton screens
 * - Error handling with retry logic
 */

'use client';

import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';
import { usePrefetchNavigation } from '@/hooks/usePrefetchNavigation';
import LoadingSpinner from './LoadingSpinner';

interface OptimisticLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
  /** API endpoints to prefetch when hovering */
  prefetchApi?: string[];
  /** Show loading state during navigation */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Delay before showing loading state (ms) */
  loadingDelay?: number;
  /** Children - can be a function that receives loading state */
  children?: React.ReactNode | ((isLoading: boolean) => React.ReactNode);
  /** Enable optimistic UI updates */
  optimistic?: boolean;
  /** Optional onClick handler */
  onClick?: (e: React.MouseEvent) => void;
}

export default function OptimisticLink({
  href,
  prefetchApi = [],
  showLoading = false,
  loadingComponent,
  loadingDelay = 100,
  children,
  optimistic = false,
  onClick,
  ...linkProps
}: OptimisticLinkProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { prefetchData, cancelPrefetch, navigateWithOptimism } = usePrefetchNavigation(
    href,
    {
      apiEndpoints: prefetchApi,
      optimistic,
    }
  );

  const handleNavigation = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onClick) {
      onClick(e);
    }

    // Cancel any pending prefetch
    cancelPrefetch();

    // Show loading state if enabled
    if (showLoading) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);
      }, loadingDelay);
    }

    setIsNavigating(true);

    try {
      if (optimistic) {
        // Use optimistic navigation
        navigateWithOptimism();
      } else {
        // Standard navigation
        router.push(href);
      }

      // Clear loading state after navigation completes
      navigationTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setIsNavigating(false);
      }, 1000);
    } catch (error) {
      console.error('Navigation failed:', error);
      setIsLoading(false);
      setIsNavigating(false);
    }
  }, [href, showLoading, loadingDelay, optimistic, cancelPrefetch, navigateWithOptimism, router, onClick]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(loadingTimeoutRef.current);
      clearTimeout(navigationTimeoutRef.current);
    };
  }, []);

  // Render children
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children(isLoading || isNavigating);
    }
    return children;
  };

  return (
    <>
      <Link
        href={href}
        {...linkProps}
        onMouseEnter={prefetchData}
        onMouseLeave={cancelPrefetch}
        onFocus={prefetchData}
        onBlur={cancelPrefetch}
        onClick={handleNavigation}
        className={linkProps.className}
      >
        {renderChildren()}
      </Link>

      {/* Show loading overlay if enabled and loading */}
      {showLoading && isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          {loadingComponent || <LoadingSpinner size={48} />}
        </div>
      )}
    </>
  );
}