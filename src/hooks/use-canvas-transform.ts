import { useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { transformAtom } from "@/store/atoms/canvas-atom";
import type { Position } from "@/types/canvas";
import { pan, zoomAtPoint, resetTransform, fitToBounds } from "@/lib/canvas/transform";
import { getImagesBounds } from "@/lib/canvas/geometry";
import type { CanvasImage } from "@/types/image";

/**
 * Hook for managing canvas pan/zoom transform
 */
export function useCanvasTransform() {
  const [transform, setTransform] = useAtom(transformAtom);
  const isPanningRef = useRef(false);
  const lastPointerRef = useRef<Position | null>(null);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      // Get pointer position relative to canvas
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const screenPoint: Position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Apply zoom centered on cursor
      setTransform((prev) => zoomAtPoint(prev, e.deltaY, screenPoint));
    },
    [setTransform]
  );

  const handlePanStart = useCallback((screenPoint: Position) => {
    isPanningRef.current = true;
    lastPointerRef.current = screenPoint;
  }, []);

  const handlePanMove = useCallback(
    (screenPoint: Position) => {
      if (!isPanningRef.current || !lastPointerRef.current) return;

      const deltaX = screenPoint.x - lastPointerRef.current.x;
      const deltaY = screenPoint.y - lastPointerRef.current.y;

      setTransform((prev) => pan(prev, deltaX, deltaY));
      lastPointerRef.current = screenPoint;
    },
    [setTransform]
  );

  const handlePanEnd = useCallback(() => {
    isPanningRef.current = false;
    lastPointerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setTransform(resetTransform());
  }, [setTransform]);

  const fitToContent = useCallback(
    (images: CanvasImage[], viewportWidth: number, viewportHeight: number) => {
      const bounds = getImagesBounds(images);
      if (bounds) {
        setTransform(fitToBounds(bounds, viewportWidth, viewportHeight));
      } else {
        reset();
      }
    },
    [setTransform, reset]
  );

  return {
    transform,
    isPanning: isPanningRef.current,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    reset,
    fitToContent,
  };
}
