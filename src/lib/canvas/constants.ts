/**
 * Canvas configuration constants
 */

/** Minimum zoom level (10%) */
export const MIN_SCALE = 0.1;

/** Maximum zoom level (500%) */
export const MAX_SCALE = 5;

/** Zoom speed multiplier for wheel events */
export const ZOOM_SPEED = 0.001;

/** Base grid size in world units */
export const BASE_GRID_SIZE = 50;

/** Grid size thresholds for adaptive scaling */
export const GRID_THRESHOLDS = [
  { maxScale: 0.25, gridSize: 200 },
  { maxScale: 0.5, gridSize: 100 },
  { maxScale: 2, gridSize: 50 },
  { maxScale: Infinity, gridSize: 25 },
] as const;

/** Grid line colors (using CSS variable names) */
export const GRID_COLORS = {
  minor: "oklch(0.9 0 0 / 0.5)",
  major: "oklch(0.85 0 0 / 0.7)",
} as const;

/** Major grid line interval (every N minor lines) */
export const MAJOR_GRID_INTERVAL = 5;

/** Selection box styling */
export const SELECTION_STYLE = {
  strokeColor: "oklch(0.6 0.15 250)",
  strokeWidth: 2,
  fillColor: "oklch(0.6 0.15 250 / 0.1)",
} as const;

/** Resize handle styling */
export const HANDLE_STYLE = {
  size: 8,
  fillColor: "white",
  strokeColor: "oklch(0.6 0.15 250)",
  strokeWidth: 2,
} as const;

/** Minimum image size in pixels */
export const MIN_IMAGE_SIZE = 20;

/** Default image size when dropped */
export const DEFAULT_IMAGE_SIZE = 200;
