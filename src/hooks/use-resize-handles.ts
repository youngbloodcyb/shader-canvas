import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  transformAtom,
  selectedImageAtom,
  updateImageAtom,
} from "@/store";
import type { Position, ResizeHandlePosition, ResizeOperation } from "@/types/canvas";
import { findHandleAtPoint, calculateResize, imageToRect, getHandleCursor } from "@/lib/canvas/geometry";
import { screenToWorld } from "@/lib/canvas/transform";

/**
 * Hook for image resize handles
 */
export function useResizeHandles() {
  const transform = useAtomValue(transformAtom);
  const selectedImage = useAtomValue(selectedImageAtom);
  const updateImage = useSetAtom(updateImageAtom);

  const resizeOperationRef = useRef<ResizeOperation | null>(null);
  const isResizingRef = useRef(false);
  const hoveredHandleRef = useRef<ResizeHandlePosition | null>(null);

  const checkHandleHover = useCallback(
    (screenPoint: Position): ResizeHandlePosition | null => {
      if (!selectedImage) return null;
      const handle = findHandleAtPoint(screenPoint, selectedImage, transform);
      hoveredHandleRef.current = handle;
      return handle;
    },
    [selectedImage, transform]
  );

  const getCursor = useCallback((): string => {
    if (resizeOperationRef.current) {
      return getHandleCursor(resizeOperationRef.current.handle);
    }
    if (hoveredHandleRef.current) {
      return getHandleCursor(hoveredHandleRef.current);
    }
    return "default";
  }, []);

  const handleMouseDown = useCallback(
    (screenPoint: Position, _shiftKey: boolean): boolean => {
      if (!selectedImage) return false;

      const handle = findHandleAtPoint(screenPoint, selectedImage, transform);
      if (!handle) return false;

      resizeOperationRef.current = {
        imageId: selectedImage.id,
        handle,
        startRect: imageToRect(selectedImage),
        startPointer: screenToWorld(screenPoint, transform),
      };

      return true;
    },
    [selectedImage, transform]
  );

  const handleMouseMove = useCallback(
    (screenPoint: Position, shiftKey: boolean): boolean => {
      if (!resizeOperationRef.current) return false;

      isResizingRef.current = true;
      const { handle, startRect, startPointer, imageId } = resizeOperationRef.current;

      const currentWorld = screenToWorld(screenPoint, transform);
      const delta: Position = {
        x: currentWorld.x - startPointer.x,
        y: currentWorld.y - startPointer.y,
      };

      const newRect = calculateResize(handle, startRect, delta, shiftKey);

      updateImage({
        id: imageId,
        changes: {
          position: { x: newRect.x, y: newRect.y },
          size: { width: newRect.width, height: newRect.height },
        },
      });

      return true;
    },
    [transform, updateImage]
  );

  const handleMouseUp = useCallback((): boolean => {
    const wasResizing = isResizingRef.current;
    resizeOperationRef.current = null;
    isResizingRef.current = false;
    return wasResizing;
  }, []);

  return {
    isResizing: isResizingRef.current,
    hoveredHandle: hoveredHandleRef.current,
    checkHandleHover,
    getCursor,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
