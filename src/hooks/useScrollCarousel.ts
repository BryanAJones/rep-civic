import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks scroll progress on a native scroll-snap container and provides
 * a jumpTo function for programmatic navigation. Replaces the manual
 * useSwipeGesture hook with browser-native scroll behavior.
 */
export function useScrollCarousel(count: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onScroll() {
      const el = containerRef.current;
      if (!el || el.scrollWidth === el.clientWidth) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const raw = el.scrollLeft / maxScroll;
      setProgress(raw * (count - 1));
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  const jumpTo = useCallback((index: number) => {
    const el = containerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, count - 1));
    const panelWidth = el.clientWidth;
    el.scrollTo({ left: clamped * panelWidth, behavior: 'smooth' });
  }, [count]);

  return { progress, jumpTo, containerRef };
}
