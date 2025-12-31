/**
 * 2D position in world coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Dimensions (width and height)
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle with position and size
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Canvas viewport transform
 * - offsetX/offsetY: Pan offset in screen pixels
 * - scale: Zoom level (1 = 100%)
 */
export interface CanvasTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

/**
 * Resize handle positions
 */
export type ResizeHandlePosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "right"
  | "bottom"
  | "left";

/**
 * Mouse/pointer state for canvas interactions
 */
export interface PointerState {
  isDown: boolean;
  startPosition: Position | null;
  currentPosition: Position | null;
}

/**
 * Canvas interaction mode
 */
export type InteractionMode =
  | "idle"
  | "panning"
  | "dragging"
  | "resizing"
  | "selecting";

/**
 * Active resize operation
 */
export interface ResizeOperation {
  imageId: string;
  handle: ResizeHandlePosition;
  startRect: Rect;
  startPointer: Position;
}

/**
 * Active drag operation
 */
export interface DragOperation {
  imageIds: string[];
  startPositions: Map<string, Position>;
  startPointer: Position;
}
