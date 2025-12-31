import type { Position, Size } from "./canvas";
import type { ShaderLayer } from "./shader";

/**
 * Represents an image on the canvas
 */
export interface CanvasImage {
  /** Unique identifier */
  id: string;
  /** Image URL (local or Vercel Blob) */
  url: string;
  /** Top-left corner position in world coordinates */
  position: Position;
  /** Current display size */
  size: Size;
  /** Original image dimensions (for aspect ratio) */
  originalSize: Size;
  /** Applied shader effects */
  shaderLayers: ShaderLayer[];
  /** Layer ordering (higher = on top) */
  zIndex: number;
  /** Prevent modifications when true */
  locked: boolean;
  /** Visibility toggle */
  visible: boolean;
}

/**
 * Input for creating a new image
 */
export interface CreateImageInput {
  url: string;
  position: Position;
  size: Size;
  originalSize?: Size;
}

/**
 * Partial update for an image
 */
export type ImageUpdate = Partial<
  Pick<CanvasImage, "position" | "size" | "locked" | "visible" | "zIndex">
>;
