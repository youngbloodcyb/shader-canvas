import { atom } from "jotai";
import { canvasStateAtom } from "./canvas-atom";
import { imagesAtom } from "./images-atom";

/**
 * Selected image IDs - derived from canvas state
 */
export const selectedImageIdsAtom = atom(
  (get) => get(canvasStateAtom).selectedImageIds,
  (_get, set, ids: string[]) => {
    set(canvasStateAtom, (prev) => ({
      ...prev,
      selectedImageIds: ids,
      updatedAt: Date.now(),
    }));
  }
);

/**
 * Get all selected images
 */
export const selectedImagesAtom = atom((get) => {
  const images = get(imagesAtom);
  const selectedIds = get(selectedImageIdsAtom);
  return images.filter((img) => selectedIds.includes(img.id));
});

/**
 * Get single selected image (for single selection mode)
 */
export const selectedImageAtom = atom((get) => {
  const selectedImages = get(selectedImagesAtom);
  return selectedImages.length === 1 ? selectedImages[0] : null;
});

/**
 * Check if an image is selected
 */
export const isSelectedAtom = atom((get) => {
  const selectedIds = get(selectedImageIdsAtom);
  return (imageId: string) => selectedIds.includes(imageId);
});

/**
 * Select a single image (clear previous selection)
 */
export const selectImageAtom = atom(
  null,
  (_get, set, imageId: string | null) => {
    if (imageId === null) {
      set(selectedImageIdsAtom, []);
    } else {
      set(selectedImageIdsAtom, [imageId]);
    }
  }
);

/**
 * Toggle selection of an image (for multi-select with Shift)
 */
export const toggleSelectionAtom = atom(null, (get, set, imageId: string) => {
  const selectedIds = get(selectedImageIdsAtom);
  if (selectedIds.includes(imageId)) {
    set(
      selectedImageIdsAtom,
      selectedIds.filter((id) => id !== imageId)
    );
  } else {
    set(selectedImageIdsAtom, [...selectedIds, imageId]);
  }
});

/**
 * Add to selection (for multi-select)
 */
export const addToSelectionAtom = atom(null, (get, set, imageId: string) => {
  const selectedIds = get(selectedImageIdsAtom);
  if (!selectedIds.includes(imageId)) {
    set(selectedImageIdsAtom, [...selectedIds, imageId]);
  }
});

/**
 * Clear all selection
 */
export const clearSelectionAtom = atom(null, (_get, set) => {
  set(selectedImageIdsAtom, []);
});

/**
 * Select all images
 */
export const selectAllAtom = atom(null, (get, set) => {
  const images = get(imagesAtom);
  set(
    selectedImageIdsAtom,
    images.map((img) => img.id)
  );
});

/**
 * Delete selected images
 */
export const deleteSelectedAtom = atom(null, (get, set) => {
  const selectedIds = get(selectedImageIdsAtom);
  const images = get(imagesAtom);
  set(
    imagesAtom,
    images.filter((img) => !selectedIds.includes(img.id))
  );
  set(selectedImageIdsAtom, []);
});
