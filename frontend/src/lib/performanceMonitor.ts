/**
 * Performance Monitoring Utility
 * 
 * Tracks and reports performance metrics for the UG Clinic Portal.
 * Helps measure the impact of performance optimizations.
 */

interface PerformanceMetrics {
  // Navigation timing
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  
  // Resource timing
  totalResources: number;
  cachedResources: number;
  externalResources: number;
  
  // Custom metrics
  apiResponseTime: number;
  renderTime: number;
  interactionTime: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    this.isInitialized = true;
    this.measureNavigationTiming();
    this.measureResourceTiming();
    this.measureWebVitals();
    this.setupCustomMetrics();
    
    console.log('[Performance Monitor] Initialized');
  }

  /**
   * Measure navigation timing metrics
   */
  private measureNavigationTiming() {
    if (!performance.getEntriesByType) return;

    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navTiming) {
      this.metrics.pageLoadTime = navTiming.loadEventEnd - navTiming.fetchStart;
      this.metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
    }
  }

  /**
   * Measure resource timing metrics
   */
  private measureResourceTiming() {
    if (!performance.getEntriesByType) return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    this.metrics.totalResources = resources.length;
    this.metrics.cachedResources = resources.filter(r => 
      r.transferSize === 0 || r.transferSize < r.encodedBodySize
    ).length;
    this.metrics.externalResources = resources.filter(r => 
      !r.name.startsWith(window.location.origin)
    ).length;
  }

  /**
   * Measure Web Vitals
   */
  private measureWebVitals() {
    try {
      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1] as any;
          this.metrics.largestContentfulPaint = lcp.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fid = entries[0] as any;
          this.metrics.firstInputDelay = fid.processingStart - fid.startTime;
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries[0] as any;
          this.metrics.firstContentfulPaint = fcp.startTime;
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      }
    } catch (error) {
      console.warn('[Performance Monitor] Web Vitals measurement failed:', error);
    }
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics() {
    // Mark when React starts rendering
    if (performance.mark) {
      performance.mark('react-render-start');
    }
  }

  /**
   * Measure API response time
   */
  measureApiCall(apiName: string, duration: number) {
    const key = `api_${apiName}_time`;
    this.metrics[key as keyof PerformanceMetrics] = duration as any;
    
    // Also track in performance timeline
    if (performance.mark) {
      performance.mark(`${apiName}-start`);
      performance.mark(`${apiName}-end`);
      performance.measure(apiName, `${apiName}-start`, `${apiName}-end`);
    }
  }

  /**
   * Measure render time
   */
  measureRenderTime(componentName: string, duration: number) {
    const key = `render_${componentName}_time`;
    this.metrics[key as keyof PerformanceMetrics] = duration as any;
  }

  /**
   * Measure user interaction time
   */
  measureInteraction(interactionName: string, duration: number) {
    const key = `interaction_${interactionName}_time`;
    this.metrics[key as keyof PerformanceMetrics] = duration as any;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: this.metrics.pageLoadTime || 0,
      domContentLoaded: this.metrics.domContentLoaded || 0,
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      firstInputDelay: this.metrics.firstInputDelay || 0,
      totalResources: this.metrics.totalResources || 0,
      cachedResources: this.metrics.cachedResources || 0,
      externalResources: this.metrics.externalResources || 0,
      apiResponseTime: this.metrics.apiResponseTime || 0,
      renderTime: this.metrics.renderTime || 0,
      interactionTime: this.metrics.interactionTime || 0,
    };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    const metrics = this.getMetrics();
    
    let score = 100;
    
    // Deduct for slow page load
    if (metrics.pageLoadTime > 3000) score -= 20;
    else if (metrics.pageLoadTime > 2000) score -= 10;
    
    // Deduct for slow LCP
    if (metrics.largestContentfulPaint > 4000) score -= 20;
    else if (metrics.largestContentfulPaint > 2500) score -= 10;
    
    // Deduct for slow FID
    if (metrics.firstInputDelay > 300) score -= 15;
    else if (metrics.firstInputDelay > 100) score -= 5;
    
    // Bonus for high cache hit rate
    if (metrics.totalResources > 0) {
      const cacheRatio = metrics.cachedResources / metrics.totalResources;
      if (cacheRatio > 0.8) score += 10;
      else if (cacheRatio > 0.5) score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Log performance report
   */
  logReport() {
    const metrics = this.getMetrics();
    const score = this.getPerformanceScore();
    
    console.group('[Performance Report]');
    console.log(`Overall Score: ${score}/100`);
    console.log('Navigation Timing:', {
      'Page Load': `${metrics.pageLoadTime.toFixed(0)}ms`,
      'DOM Content Loaded': `${metrics.domContentLoaded.toFixed(0)}ms`,
      'First Contentful Paint': `${metrics.firstContentfulPaint.toFixed(0)}ms`,
      'Largest Contentful Paint': `${metrics.largestContentfulPaint.toFixed(0)}ms`,
      'First Input Delay': `${metrics.firstInputDelay.toFixed(0)}ms`,
    });
    console.log('Resource Timing:', {
      'Total Resources': metrics.totalResources,
      'Cached Resources': metrics.cachedResources,
      'Cache Hit Rate': metrics.totalResources > 0 
        ? `${((metrics.cachedResources / metrics.totalResources) * 100).toFixed(1)}%`
        : 'N/A',
      'External Resources': metrics.externalResources,
    });
    console.groupEnd();
  }

  /**
   * Cleanup observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Initialize after page load
  if (document.readyState === 'complete') {
    performanceMonitor.init();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.init();
    });
  }

  // Log report on dev environment
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      performanceMonitor.logReport();
    }, 2000);
  }
}

// Export utility functions for manual measurement
export function measureApiCall<T>(
  apiName: string,
  apiFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  return apiFn().finally(() => {
    const duration = performance.now() - start;
    performanceMonitor.measureApiCall(apiName, duration);
  });
}

export function measureRenderTime(
  componentName: string,
  renderFn: () => void
) {
  const start = performance.now();
  renderFn();
  const duration = performance.now() - start;
  performanceMonitor.measureRenderTime(componentName, duration);
  return duration;
}

export function measureInteraction(
  interactionName: string,
  interactionFn: () => void | Promise<void>
) {
  const start = performance.now();
  const result = interactionFn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      performanceMonitor.measureInteraction(interactionName, duration);
    });
  } else {
    const duration = performance.now() - start;
    performanceMonitor.measureInteraction(interactionName, duration);
    return result;
  }
}