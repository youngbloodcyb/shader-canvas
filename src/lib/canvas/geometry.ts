import type {
  Position,
  Rect,
  ResizeHandlePosition,
  CanvasTransform,
} from "@/types/canvas";
import type { CanvasImage } from "@/types/image";
import { HANDLE_STYLE, MIN_IMAGE_SIZE } from "./constants";
import { screenToWorld } from "./transform";

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(point: Position, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Get bounding rectangle from an image
 */
export function imageToRect(image: CanvasImage): Rect {
  return {
    x: image.position.x,
    y: image.position.y,
    width: image.size.width,
    height: image.size.height,
  };
}

/**
 * Hit test an image at a world position
 */
export function hitTestImage(
  worldPoint: Position,
  image: CanvasImage
): boolean {
  if (!image.visible) return false;
  return pointInRect(worldPoint, imageToRect(image));
}

/**
 * Find the topmost image at a screen position
 */
export function findImageAtPoint(
  screenPoint: Position,
  images: CanvasImage[],
  transform: CanvasTransform
): CanvasImage | null {
  const worldPoint = screenToWorld(screenPoint, transform);

  // Sort by z-index descending (topmost first)
  const sortedImages = [...images].sort((a, b) => b.zIndex - a.zIndex);

  for (const image of sortedImages) {
    if (hitTestImage(worldPoint, image)) {
      return image;
    }
  }

  return null;
}

/**
 * Get resize handle rectangles for an image in screen space
 */
export function getResizeHandles(
  image: CanvasImage,
  transform: CanvasTransform
): Map<ResizeHandlePosition, Rect> {
  const handles = new Map<ResizeHandlePosition, Rect>();
  const halfSize = HANDLE_STYLE.size / 2;

  // Convert image corners to screen space
  const topLeft = {
    x: image.position.x * transform.scale + transform.offsetX,
    y: image.position.y * transform.scale + transform.offsetY,
  };
  const bottomRight = {
    x: (image.position.x + image.size.width) * transform.scale + transform.offsetX,
    y: (image.position.y + image.size.height) * transform.scale + transform.offsetY,
  };
  const midX = (topLeft.x + bottomRight.x) / 2;
  const midY = (topLeft.y + bottomRight.y) / 2;

  // Corner handles
  handles.set("top-left", {
    x: topLeft.x - halfSize,
    y: topLeft.y - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });
  handles.set("top-right", {
    x: bottomRight.x - halfSize,
    y: topLeft.y - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });
  handles.set("bottom-left", {
    x: topLeft.x - halfSize,
    y: bottomRight.y - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });
  handles.set("bottom-right", {
    x: bottomRight.x - halfSize,
    y: bottomRight.y - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });

  // Edge handles
  handles.set("top", {
    x: midX - halfSize,
    y: topLeft.y - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });
  handles.set("right", {
    x: bottomRight.x - halfSize,
    y: midY - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });
  handles.set("bottom", {
    x: midX - halfSize,
    y: bottomRight.y - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });
  handles.set("left", {
    x: topLeft.x - halfSize,
    y: midY - halfSize,
    width: HANDLE_STYLE.size,
    height: HANDLE_STYLE.size,
  });

  return handles;
}

/**
 * Find which resize handle (if any) is at a screen position
 */
export function findHandleAtPoint(
  screenPoint: Position,
  image: CanvasImage,
  transform: CanvasTransform
): ResizeHandlePosition | null {
  const handles = getResizeHandles(image, transform);

  for (const [position, rect] of handles) {
    if (pointInRect(screenPoint, rect)) {
      return position;
    }
  }

  return null;
}

/**
 * Calculate new rect after resize operation
 */
export function calculateResize(
  handle: ResizeHandlePosition,
  startRect: Rect,
  delta: Position,
  maintainAspectRatio: boolean = false
): Rect {
  let { x, y, width, height } = startRect;
  const aspectRatio = startRect.width / startRect.height;

  switch (handle) {
    case "top-left":
      x += delta.x;
      y += delta.y;
      width -= delta.x;
      height -= delta.y;
      break;
    case "top-right":
      y += delta.y;
      width += delta.x;
      height -= delta.y;
      break;
    case "bottom-left":
      x += delta.x;
      width -= delta.x;
      height += delta.y;
      break;
    case "bottom-right":
      width += delta.x;
      height += delta.y;
      break;
    case "top":
      y += delta.y;
      height -= delta.y;
      break;
    case "right":
      width += delta.x;
      break;
    case "bottom":
      height += delta.y;
      break;
    case "left":
      x += delta.x;
      width -= delta.x;
      break;
  }

  // Enforce minimum size
  if (width < MIN_IMAGE_SIZE) {
    if (handle.includes("left")) {
      x = startRect.x + startRect.width - MIN_IMAGE_SIZE;
    }
    width = MIN_IMAGE_SIZE;
  }
  if (height < MIN_IMAGE_SIZE) {
    if (handle.includes("top")) {
      y = startRect.y + startRect.height - MIN_IMAGE_SIZE;
    }
    height = MIN_IMAGE_SIZE;
  }

  // Maintain aspect ratio if requested
  if (maintainAspectRatio && (handle.includes("top") || handle.includes("bottom") || handle.includes("left") || handle.includes("right"))) {
    if (handle === "top" || handle === "bottom") {
      const newWidth = height * aspectRatio;
      x = startRect.x + (startRect.width - newWidth) / 2;
      width = newWidth;
    } else if (handle === "left" || handle === "right") {
      const newHeight = width / aspectRatio;
      y = startRect.y + (startRect.height - newHeight) / 2;
      height = newHeight;
    } else {
      // Corner handles
      const currentRatio = width / height;
      if (currentRatio > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
    }
  }

  return { x, y, width, height };
}

/**
 * Get combined bounding box for multiple images
 */
export function getImagesBounds(
  images: CanvasImage[]
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (images.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const image of images) {
    minX = Math.min(minX, image.position.x);
    minY = Math.min(minY, image.position.y);
    maxX = Math.max(maxX, image.position.x + image.size.width);
    maxY = Math.max(maxY, image.position.y + image.size.height);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Get cursor style for a resize handle
 */
export function getHandleCursor(handle: ResizeHandlePosition): string {
  switch (handle) {
    case "top-left":
    case "bottom-right":
      return "nwse-resize";
    case "top-right":
    case "bottom-left":
      return "nesw-resize";
    case "top":
    case "bottom":
      return "ns-resize";
    case "left":
    case "right":
      return "ew-resize";
    default:
      return "default";
  }
}
