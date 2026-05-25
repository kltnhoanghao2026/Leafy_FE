import { useEffect, useRef, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * A React hook that wraps the IntersectionObserver API.
 * Returns a callback ref to attach to elements you want to observe.
 *
 * @param callback - Function called when the observed element enters/leaves the viewport
 * @param options - IntersectionObserver configuration options
 * @returns A callback ref to attach to the target element
 *
 * @example
 * ```tsx
 * const setRef = useIntersectionObserver((entry) => {
 *   if (entry.isIntersecting) {
 *     console.log('Element is visible!');
 *   }
 * });
 *
 * return <div ref={setRef}>Observed content</div>;
 * ```
 */
export function useIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.5, root = null, rootMargin = '0px', enabled = true } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback(
    (element: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (element && enabled) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                callback(entry);
              }
            });
          },
          { threshold, root, rootMargin }
        );
        observerRef.current.observe(element);
      }
    },
    [callback, threshold, root, rootMargin, enabled]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return setRef;
}
