import { useCallback, useEffect, useRef, useState } from "react";

// Performance monitoring hook for React components
export function usePerformanceMonitor(componentName) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    reRenderFrequency: 0,
  });

  const trackRender = useCallback(() => {
    const now = Date.now();
    const renderTime = now - lastRenderTimeRef.current;
    
    renderCountRef.current += 1;
    lastRenderTimeRef.current = now;
    
    setPerformanceMetrics(prev => {
      const newRenderCount = renderCountRef.current;
      const totalTime = prev.averageRenderTime * (newRenderCount - 1) + renderTime;
      const newAverageRenderTime = totalTime / newRenderCount;
      
      return {
        renderCount: newRenderCount,
        averageRenderTime: newAverageRenderTime,
        lastRenderTime: renderTime,
        reRenderFrequency: newRenderCount / (Date.now() - (prev.startTime || now)) * 1000,
      };
    });
  }, []);

  // Log performance warnings in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (performanceMetrics.averageRenderTime > 16) {
        console.warn(`⚠️ ${componentName} has slow renders (${performanceMetrics.averageRenderTime.toFixed(2)}ms avg)`);
      }
      
      if (performanceMetrics.reRenderFrequency > 10) {
        console.warn(`⚠️ ${componentName} is re-rendering frequently (${performanceMetrics.reRenderFrequency.toFixed(2)} renders/sec)`);
      }
    }
  }, [componentName, performanceMetrics]);

  return {
    trackRender,
    metrics: performanceMetrics,
  };
}

// Hook for monitoring component prop changes
export function usePropChangeTracker(componentName, props) {
  const prevPropsRef = useRef();
  const [changeLog, setChangeLog] = useState([]);

  useEffect(() => {
    if (prevPropsRef.current) {
      const changes = [];
      
      Object.keys(props).forEach(key => {
        if (prevPropsRef.current[key] !== props[key]) {
          changes.push({
            prop: key,
            oldValue: prevPropsRef.current[key],
            newValue: props[key],
            timestamp: Date.now(),
          });
        }
      });
      
      if (changes.length > 0) {
        setChangeLog(prev => [...prev.slice(-9), changes]);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 ${componentName} prop changes:`, changes);
        }
      }
    }
    
    prevPropsRef.current = props;
  });

  return changeLog;
}

// Hook for memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryInfo = () => {
        setMemoryInfo({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        });
      };

      updateMemoryInfo();
      const interval = setInterval(updateMemoryInfo, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);

  return memoryInfo;
}

// Hook for network performance monitoring
export function useNetworkMonitor() {
  const [networkInfo, setNetworkInfo] = useState({
    online: navigator.onLine,
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      setNetworkInfo({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 10,
        rtt: connection?.rtt || 100,
      });
    };

    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();
    const handleConnectionChange = () => updateNetworkInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkInfo;
}

// Debounce hook for performance optimization
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance optimization
export function useThrottle(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastExecuted.current >= delay) {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }
    }, delay - (Date.now() - lastExecuted.current) % delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

// Hook for virtual scrolling performance
export function useVirtualScrolling({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [items.length, itemHeight, containerHeight, scrollTop, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
}
