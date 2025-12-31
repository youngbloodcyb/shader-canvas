import type { CanvasTransform } from "./canvas";
import type { CanvasImage } from "./image";

/**
 * Full canvas state shape
 */
export interface CanvasState {
  /** Canvas identifier for persistence */
  id: string;
  /** User-facing name */
  name: string;
  /** Viewport transform (pan/zoom) */
  transform: CanvasTransform;
  /** All images on canvas */
  images: CanvasImage[];
  /** Currently selected image IDs */
  selectedImageIds: string[];
  /** Grid visibility toggle */
  gridVisible: boolean;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Create a new empty canvas state
 */
export function createCanvasState(
  id: string,
  name: string = "Untitled Canvas"
): CanvasState {
  return {
    id,
    name,
    transform: { offsetX: 0, offsetY: 0, scale: 1 },
    images: [],
    selectedImageIds: [],
    gridVisible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
