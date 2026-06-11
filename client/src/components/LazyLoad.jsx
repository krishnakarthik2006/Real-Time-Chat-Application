import { useState, useEffect, useRef } from "react";

export default function LazyLoad({ 
  children, 
  fallback = null, 
  rootMargin = "100px",
  threshold = 0.1 
}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [rootMargin, threshold, hasLoaded]);

  return (
    <div ref={ref} style={{ minHeight: fallback ? "200px" : "auto" }}>
      {isIntersecting ? children : fallback}
    </div>
  );
}

// HOC for lazy loading components
export function withLazyLoad(Component, fallback = null) {
  return function LazyLoadedComponent(props) {
    return (
      <LazyLoad fallback={fallback}>
        <Component {...props} />
      </LazyLoad>
    );
  };
}

// Hook for infinite scrolling
export function useInfiniteScroll({ 
  hasNextPage, 
  fetchNextPage, 
  threshold = 100 
}) {
  const [isFetching, setIsFetching] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isFetching || !hasNextPage) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        setIsFetching(true);
        fetchNextPage().finally(() => {
          setIsFetching(false);
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [hasNextPage, fetchNextPage, isFetching, threshold]);

  return { containerRef, isFetching };
}
