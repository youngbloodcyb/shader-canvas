import { atom } from "jotai";
import { canvasStateAtom, generateId } from "./canvas-atom";
import type { CanvasImage, CreateImageInput, ImageUpdate } from "@/types/image";

/**
 * All images on canvas - derived from canvas state
 */
export const imagesAtom = atom(
  (get) => get(canvasStateAtom).images,
  (_get, set, images: CanvasImage[]) => {
    set(canvasStateAtom, (prev) => ({
      ...prev,
      images,
      updatedAt: Date.now(),
    }));
  }
);

/**
 * Get the next z-index value
 */
function getNextZIndex(images: CanvasImage[]): number {
  if (images.length === 0) return 1;
  return Math.max(...images.map((img) => img.zIndex)) + 1;
}

/**
 * Add a new image to the canvas
 */
export const addImageAtom = atom(null, (get, set, input: CreateImageInput) => {
  const images = get(imagesAtom);
  const newImage: CanvasImage = {
    id: generateId(),
    url: input.url,
    position: input.position,
    size: input.size,
    originalSize: input.originalSize ?? input.size,
    shaderLayers: [],
    zIndex: getNextZIndex(images),
    locked: false,
    visible: true,
  };

  set(imagesAtom, [...images, newImage]);
  return newImage.id;
});

/**
 * Remove an image by ID
 */
export const removeImageAtom = atom(null, (get, set, imageId: string) => {
  const images = get(imagesAtom);
  set(
    imagesAtom,
    images.filter((img) => img.id !== imageId)
  );

  // Also remove from selection
  set(canvasStateAtom, (prev) => ({
    ...prev,
    selectedImageIds: prev.selectedImageIds.filter((id) => id !== imageId),
  }));
});

/**
 * Update an image's properties
 */
export const updateImageAtom = atom(
  null,
  (get, set, payload: { id: string; changes: ImageUpdate }) => {
    const images = get(imagesAtom);
    set(
      imagesAtom,
      images.map((img) =>
        img.id === payload.id ? { ...img, ...payload.changes } : img
      )
    );
  }
);

/**
 * Move image to front (highest z-index)
 */
export const bringToFrontAtom = atom(null, (get, set, imageId: string) => {
  const images = get(imagesAtom);
  const maxZ = getNextZIndex(images);
  set(
    imagesAtom,
    images.map((img) => (img.id === imageId ? { ...img, zIndex: maxZ } : img))
  );
});

/**
 * Move image to back (lowest z-index)
 */
export const sendToBackAtom = atom(null, (get, set, imageId: string) => {
  const images = get(imagesAtom);
  const minZ = Math.min(...images.map((img) => img.zIndex)) - 1;
  set(
    imagesAtom,
    images.map((img) => (img.id === imageId ? { ...img, zIndex: minZ } : img))
  );
});

/**
 * Get a single image by ID
 */
export const imageByIdAtom = atom((get) => {
  const images = get(imagesAtom);
  return (id: string) => images.find((img) => img.id === id);
});

/**
 * Get images sorted by z-index (for rendering order)
 */
export const sortedImagesAtom = atom((get) => {
  const images = get(imagesAtom);
  return [...images].sort((a, b) => a.zIndex - b.zIndex);
});
