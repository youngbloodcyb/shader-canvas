import { atom } from "jotai";
import type { CanvasTransform } from "@/types/canvas";
import type { CanvasState } from "@/types/state";
import { createCanvasState } from "@/types/state";

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Main canvas state atom
 */
export const canvasStateAtom = atom<CanvasState>(
  createCanvasState(generateId())
);

/**
 * Transform (pan/zoom) atom - derived from canvas state
 */
export const transformAtom = atom(
  (get) => get(canvasStateAtom).transform,
  (get, set, update: CanvasTransform | ((prev: CanvasTransform) => CanvasTransform)) => {
    const newTransform = typeof update === "function"
      ? update(get(canvasStateAtom).transform)
      : update;
    set(canvasStateAtom, (prev) => ({
      ...prev,
      transform: newTransform,
      updatedAt: Date.now(),
    }));
  }
);

/**
 * Grid visibility atom
 */
export const gridVisibleAtom = atom(
  (get) => get(canvasStateAtom).gridVisible,
  (_get, set, visible: boolean) => {
    set(canvasStateAtom, (prev) => ({
      ...prev,
      gridVisible: visible,
      updatedAt: Date.now(),
    }));
  }
);

/**
 * Canvas name atom
 */
export const canvasNameAtom = atom(
  (get) => get(canvasStateAtom).name,
  (_get, set, name: string) => {
    set(canvasStateAtom, (prev) => ({
      ...prev,
      name,
      updatedAt: Date.now(),
    }));
  }
);

/**
 * Reset the entire canvas state
 */
export const resetCanvasAtom = atom(null, (_get, set) => {
  set(canvasStateAtom, createCanvasState(generateId()));
});
