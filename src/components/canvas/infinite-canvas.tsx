import { useRef, useCallback, useEffect, useState } from "react";
import { Provider, useSetAtom, useAtomValue } from "jotai";
import { useCanvasTransform } from "@/hooks/use-canvas-transform";
import { useCanvasRenderer } from "@/hooks/use-canvas-renderer";
import { useDragSelect } from "@/hooks/use-drag-select";
import { useResizeHandles } from "@/hooks/use-resize-handles";
import {
  addImageAtom,
  deleteSelectedAtom,
  selectAllAtom,
  selectedImageIdsAtom,
} from "@/store";
import type { Position, InteractionMode } from "@/types/canvas";
import { cn } from "@/lib/utils";
import { ShaderPanel } from "./shader-panel";

interface InfiniteCanvasProps {
  className?: string;
}

function InfiniteCanvasInner({ className }: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("idle");
  const [cursor, setCursor] = useState("default");
  const [showShaderPanel, setShowShaderPanel] = useState(true);

  const addImage = useSetAtom(addImageAtom);
  const deleteSelected = useSetAtom(deleteSelectedAtom);
  const selectAll = useSetAtom(selectAllAtom);
  const selectedIds = useAtomValue(selectedImageIdsAtom);

  const { transform, handleWheel, handlePanStart, handlePanMove, handlePanEnd } =
    useCanvasTransform();
  const { loadImage } = useCanvasRenderer(canvasRef);
  const dragSelect = useDragSelect();
  const resizeHandles = useResizeHandles();

  // Get screen point from mouse event
  const getScreenPoint = useCallback((e: React.MouseEvent): Position => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Mouse down handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return; // Only handle left click

      const screenPoint = getScreenPoint(e);

      // Check resize handles first
      if (resizeHandles.handleMouseDown(screenPoint, e.shiftKey)) {
        setInteractionMode("resizing");
        return;
      }

      // Check image selection/drag
      if (dragSelect.handleMouseDown(e, screenPoint)) {
        setInteractionMode("dragging");
        return;
      }

      // Start panning
      handlePanStart(screenPoint);
      setInteractionMode("panning");
    },
    [getScreenPoint, resizeHandles, dragSelect, handlePanStart]
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const screenPoint = getScreenPoint(e);

      // Update cursor based on hover state
      const handle = resizeHandles.checkHandleHover(screenPoint);
      if (handle) {
        setCursor(resizeHandles.getCursor());
      } else if (interactionMode === "panning") {
        setCursor("grabbing");
      } else if (interactionMode === "dragging") {
        setCursor("move");
      } else {
        setCursor("default");
      }

      // Handle active operations
      switch (interactionMode) {
        case "resizing":
          resizeHandles.handleMouseMove(screenPoint, e.shiftKey);
          break;
        case "dragging":
          dragSelect.handleMouseMove(screenPoint);
          break;
        case "panning":
          handlePanMove(screenPoint);
          break;
      }
    },
    [getScreenPoint, resizeHandles, dragSelect, handlePanMove, interactionMode]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    resizeHandles.handleMouseUp();
    dragSelect.handleMouseUp();
    handlePanEnd();
    setInteractionMode("idle");
    setCursor("default");
  }, [resizeHandles, dragSelect, handlePanEnd]);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    if (interactionMode !== "idle") {
      handleMouseUp();
    }
  }, [interactionMode, handleMouseUp]);

  // Wheel handler for zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      handleWheel(e);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [handleWheel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace to delete selected
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        e.preventDefault();
        deleteSelected();
      }

      // Cmd/Ctrl+A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
      }

      // Toggle shader panel with Tab
      if (e.key === "Tab" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowShaderPanel((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, deleteSelected, selectAll]);

  // Handle file drop
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      // Convert to world coordinates
      const worldX = (dropX - transform.offsetX) / transform.scale;
      const worldY = (dropY - transform.offsetY) / transform.scale;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);

        try {
          const img = await loadImage(url);
          const size = {
            width: Math.min(img.naturalWidth, 400),
            height: Math.min(img.naturalHeight, 400),
          };

          // Maintain aspect ratio
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          if (size.width / size.height > aspectRatio) {
            size.width = size.height * aspectRatio;
          } else {
            size.height = size.width / aspectRatio;
          }

          addImage({
            url,
            position: {
              x: worldX + i * 20,
              y: worldY + i * 20,
            },
            size,
            originalSize: {
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          });
        } catch (err) {
          console.error("Failed to load image:", err);
        }
      }
    },
    [transform, loadImage, addImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cn("flex w-full h-full", className)}
      data-slot="infinite-canvas-container"
    >
      {/* Main canvas area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-background"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-slot="infinite-canvas"
      >
        {/* Main 2D canvas - shaders are applied directly here */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-sm text-muted-foreground">
          {Math.round(transform.scale * 100)}%
        </div>

        {/* Instructions */}
        <div className="absolute top-4 left-4 px-3 py-2 bg-background/80 backdrop-blur-sm rounded text-sm text-muted-foreground">
          <p>Drop images to add</p>
          <p className="text-xs mt-1 opacity-70">
            Scroll to zoom, drag to pan, Tab to toggle panel
          </p>
        </div>
      </div>

      {/* Shader panel sidebar */}
      {showShaderPanel && (
        <div className="w-72 border-l bg-background flex flex-col">
          <ShaderPanel />
        </div>
      )}
    </div>
  );
}

/**
 * Infinite Canvas with Jotai Provider
 */
export function InfiniteCanvas({ className }: InfiniteCanvasProps) {
  return (
    <Provider>
      <InfiniteCanvasInner className={className} />
    </Provider>
  );
}
