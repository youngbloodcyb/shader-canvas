import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  transformAtom,
  sortedImagesAtom,
  selectedImageIdsAtom,
  selectImageAtom,
  toggleSelectionAtom,
  updateImageAtom,
  bringToFrontAtom,
} from "@/store";
import type { Position, DragOperation } from "@/types/canvas";
import { findImageAtPoint } from "@/lib/canvas/geometry";
import { screenToWorld } from "@/lib/canvas/transform";

/**
 * Hook for image selection and dragging
 */
export function useDragSelect() {
  const transform = useAtomValue(transformAtom);
  const images = useAtomValue(sortedImagesAtom);
  const selectedIds = useAtomValue(selectedImageIdsAtom);
  const selectImage = useSetAtom(selectImageAtom);
  const toggleSelection = useSetAtom(toggleSelectionAtom);
  const updateImage = useSetAtom(updateImageAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);

  const dragOperationRef = useRef<DragOperation | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>, screenPoint: Position) => {
      const image = findImageAtPoint(screenPoint, images, transform);

      if (image) {
        // Check if clicking on already selected image
        const isAlreadySelected = selectedIds.includes(image.id);

        if (e.shiftKey) {
          // Multi-select with shift
          toggleSelection(image.id);
        } else if (!isAlreadySelected) {
          // Single select
          selectImage(image.id);
          bringToFront(image.id);
        }

        // Start drag operation
        const imagesToDrag = isAlreadySelected
          ? selectedIds
          : e.shiftKey
            ? [...selectedIds, image.id]
            : [image.id];

        const startPositions = new Map<string, Position>();
        for (const id of imagesToDrag) {
          const img = images.find((i) => i.id === id);
          if (img) {
            startPositions.set(id, { ...img.position });
          }
        }

        dragOperationRef.current = {
          imageIds: imagesToDrag,
          startPositions,
          startPointer: screenToWorld(screenPoint, transform),
        };

        return true; // Indicate we handled the click
      } else if (!e.shiftKey) {
        // Clear selection when clicking empty space
        selectImage(null);
      }

      return false;
    },
    [
      images,
      transform,
      selectedIds,
      selectImage,
      toggleSelection,
      bringToFront,
    ]
  );

  const handleMouseMove = useCallback(
    (screenPoint: Position) => {
      if (!dragOperationRef.current) return false;

      isDraggingRef.current = true;
      const currentWorld = screenToWorld(screenPoint, transform);
      const { startPositions, startPointer } = dragOperationRef.current;

      const deltaX = currentWorld.x - startPointer.x;
      const deltaY = currentWorld.y - startPointer.y;

      for (const [id, startPos] of startPositions) {
        updateImage({
          id,
          changes: {
            position: {
              x: startPos.x + deltaX,
              y: startPos.y + deltaY,
            },
          },
        });
      }

      return true;
    },
    [transform, updateImage]
  );

  const handleMouseUp = useCallback(() => {
    const wasDragging = isDraggingRef.current;
    dragOperationRef.current = null;
    isDraggingRef.current = false;
    return wasDragging;
  }, []);

  return {
    isDragging: isDraggingRef.current,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
