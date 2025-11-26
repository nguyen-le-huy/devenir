/**
 * Performance monitoring utilities
 * Track Web Vitals and custom metrics
 */

/**
 * Report Web Vitals to analytics
 * https://web.dev/vitals/
 */
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

/**
 * Log performance metrics to console (dev only)
 */
export const logPerformanceMetrics = () => {
  if (import.meta.env.DEV) {
    // Log when performance observer is available
    if ('PerformanceObserver' in window) {
      // Monitor navigation timing
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('⚡ Performance:', entry.name, Math.round(entry.duration) + 'ms');
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }
  }
};

/**
 * Measure component render time
 */
export const measureComponentRender = (componentName, callback) => {
  const start = performance.now();
  callback();
  const end = performance.now();
  
  if (import.meta.env.DEV) {
    console.log(`🎨 ${componentName} rendered in ${Math.round(end - start)}ms`);
  }
};

/**
 * Performance metrics thresholds (Google recommendations)
 */
export const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint
  FID: 100,  // First Input Delay
  CLS: 0.1,  // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint
  TTFB: 600, // Time to First Byte
};

/**
 * Check if metric is within good threshold
 */
export const isGoodMetric = (metricName, value) => {
  const threshold = PERFORMANCE_THRESHOLDS[metricName];
  if (!threshold) return true;
  
  // CLS is a score, others are milliseconds
  if (metricName === 'CLS') {
    return value <= threshold;
  }
  
  return value <= threshold;
};
