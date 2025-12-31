import type { CanvasTransform, Position } from "@/types/canvas";
import { MAX_SCALE, MIN_SCALE, ZOOM_SPEED } from "./constants";

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
  screen: Position,
  transform: CanvasTransform
): Position {
  return {
    x: (screen.x - transform.offsetX) / transform.scale,
    y: (screen.y - transform.offsetY) / transform.scale,
  };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  world: Position,
  transform: CanvasTransform
): Position {
  return {
    x: world.x * transform.scale + transform.offsetX,
    y: world.y * transform.scale + transform.offsetY,
  };
}

/**
 * Apply zoom centered on a specific screen position
 */
export function zoomAtPoint(
  transform: CanvasTransform,
  delta: number,
  screenPoint: Position
): CanvasTransform {
  // Calculate new scale
  const zoomFactor = 1 - delta * ZOOM_SPEED;
  const newScale = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, transform.scale * zoomFactor)
  );

  // If scale didn't change, return original
  if (newScale === transform.scale) {
    return transform;
  }

  // Get world point before zoom
  const worldPoint = screenToWorld(screenPoint, transform);

  // Calculate new offset to keep the point under cursor
  const newOffsetX = screenPoint.x - worldPoint.x * newScale;
  const newOffsetY = screenPoint.y - worldPoint.y * newScale;

  return {
    offsetX: newOffsetX,
    offsetY: newOffsetY,
    scale: newScale,
  };
}

/**
 * Apply pan by screen delta
 */
export function pan(
  transform: CanvasTransform,
  deltaX: number,
  deltaY: number
): CanvasTransform {
  return {
    ...transform,
    offsetX: transform.offsetX + deltaX,
    offsetY: transform.offsetY + deltaY,
  };
}

/**
 * Reset transform to initial state
 */
export function resetTransform(): CanvasTransform {
  return {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  };
}

/**
 * Fit the view to show all content within given bounds
 */
export function fitToBounds(
  contentBounds: { minX: number; minY: number; maxX: number; maxY: number },
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): CanvasTransform {
  const contentWidth = contentBounds.maxX - contentBounds.minX;
  const contentHeight = contentBounds.maxY - contentBounds.minY;

  if (contentWidth === 0 || contentHeight === 0) {
    return resetTransform();
  }

  // Calculate scale to fit content with padding
  const scaleX = (viewportWidth - padding * 2) / contentWidth;
  const scaleY = (viewportHeight - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, MAX_SCALE);

  // Center the content
  const centerX = (contentBounds.minX + contentBounds.maxX) / 2;
  const centerY = (contentBounds.minY + contentBounds.maxY) / 2;

  return {
    offsetX: viewportWidth / 2 - centerX * scale,
    offsetY: viewportHeight / 2 - centerY * scale,
    scale: Math.max(scale, MIN_SCALE),
  };
}
