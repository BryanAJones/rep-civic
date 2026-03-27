import { useCallback, useRef, useState } from 'react';

interface SwipeGestureOptions {
  /** Total number of panels */
  panelCount: number;
  /** Width of each panel in px (measured at mount) */
  panelWidth: number;
  /** Minimum distance (px) or velocity to trigger a snap */
  snapThreshold?: number;
  /** Callback when the active panel changes */
  onIndexChange?: (index: number) => void;
}

interface SwipeGestureResult {
  /** Current settled panel index */
  activeIndex: number;
  /** Current pixel offset of the carousel (negative = shifted left) */
  offset: number;
  /** Whether a drag is in progress */
  isDragging: boolean;
  /** Fractional progress between panels (0 = panel 0, 1.5 = halfway between 1 and 2) */
  progress: number;
  /** Jump to a specific panel index */
  jumpTo: (index: number) => void;
  /** Attach to the carousel container's pointer events */
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

export function useSwipeGesture({
  panelCount,
  panelWidth,
  snapThreshold = 0.25,
  onIndexChange,
}: SwipeGestureOptions): SwipeGestureResult {
  const [activeIndex, setActiveIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for gesture tracking (avoid re-renders during drag)
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const startTime = useRef(0);
  const axisLocked = useRef<'horizontal' | 'vertical' | null>(null);
  const pointerId = useRef<number | null>(null);
  const containerRef = useRef<Element | null>(null);

  const clampOffset = useCallback(
    (raw: number) => {
      const maxOffset = 0;
      const minOffset = -(panelCount - 1) * panelWidth;
      return Math.max(minOffset, Math.min(maxOffset, raw));
    },
    [panelCount, panelWidth],
  );

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(panelCount - 1, index));
      setActiveIndex(clamped);
      setOffset(-clamped * panelWidth);
      if (clamped !== activeIndex) {
        onIndexChange?.(clamped);
      }
    },
    [panelCount, panelWidth, activeIndex, onIndexChange],
  );

  const jumpTo = useCallback(
    (index: number) => {
      snapToIndex(index);
    },
    [snapToIndex],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only track one pointer
      if (pointerId.current !== null) return;
      pointerId.current = e.pointerId;
      containerRef.current = e.currentTarget;
      e.currentTarget.setPointerCapture(e.pointerId);

      startX.current = e.clientX;
      startY.current = e.clientY;
      startOffset.current = -activeIndex * panelWidth;
      startTime.current = Date.now();
      axisLocked.current = null;
    },
    [activeIndex, panelWidth],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;

      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      // Determine axis lock after ~8px of movement
      if (axisLocked.current === null) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx < 8 && absDy < 8) return;
        axisLocked.current = absDx > absDy ? 'horizontal' : 'vertical';
        if (axisLocked.current === 'horizontal') {
          setIsDragging(true);
        }
      }

      if (axisLocked.current !== 'horizontal') return;

      // Prevent vertical scroll while swiping horizontally
      e.preventDefault();

      // Apply rubber-band resistance at edges
      let raw = startOffset.current + dx;
      const maxOffset = 0;
      const minOffset = -(panelCount - 1) * panelWidth;

      if (raw > maxOffset) {
        raw = maxOffset + (raw - maxOffset) * 0.3;
      } else if (raw < minOffset) {
        raw = minOffset + (raw - minOffset) * 0.3;
      }

      setOffset(raw);
    },
    [panelCount, panelWidth],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;
      pointerId.current = null;

      if (axisLocked.current !== 'horizontal') {
        axisLocked.current = null;
        return;
      }

      setIsDragging(false);
      axisLocked.current = null;

      const dx = e.clientX - startX.current;
      const elapsed = Date.now() - startTime.current;
      const velocity = Math.abs(dx) / elapsed; // px/ms

      let targetIndex = activeIndex;

      // Fast flick (> 0.5 px/ms) — go to next/prev
      if (velocity > 0.5 && Math.abs(dx) > 20) {
        targetIndex = dx > 0 ? activeIndex - 1 : activeIndex + 1;
      } else {
        // Distance-based snap
        const fractional = -clampOffset(startOffset.current + dx) / panelWidth;
        const threshold = snapThreshold;
        const diff = fractional - activeIndex;

        if (diff > threshold) {
          targetIndex = activeIndex + 1;
        } else if (diff < -threshold) {
          targetIndex = activeIndex - 1;
        }
      }

      snapToIndex(targetIndex);
    },
    [activeIndex, panelWidth, snapThreshold, clampOffset, snapToIndex],
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;
      pointerId.current = null;
      setIsDragging(false);
      axisLocked.current = null;
      // Snap back to current panel
      setOffset(-activeIndex * panelWidth);
    },
    [activeIndex, panelWidth],
  );

  // Fractional progress for tab strip indicator
  const progress = panelWidth > 0 ? Math.max(0, -offset / panelWidth) : activeIndex;

  return {
    activeIndex,
    offset,
    isDragging,
    progress,
    jumpTo,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
