import { useCallback, useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { transformAtom, gridVisibleAtom, sortedImagesAtom, selectedImageIdsAtom } from "@/store";
import type { CanvasTransform } from "@/types/canvas";
import type { CanvasImage } from "@/types/image";
import {
  GRID_THRESHOLDS,
  GRID_COLORS,
  MAJOR_GRID_INTERVAL,
  SELECTION_STYLE,
  HANDLE_STYLE,
} from "@/lib/canvas/constants";
import { getResizeHandles } from "@/lib/canvas/geometry";
import { useShaderRenderer } from "./use-shader-renderer";

/**
 * Hook for canvas rendering with requestAnimationFrame
 */
export function useCanvasRenderer(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const transform = useAtomValue(transformAtom);
  const gridVisible = useAtomValue(gridVisibleAtom);
  const images = useAtomValue(sortedImagesAtom);
  const selectedIds = useAtomValue(selectedImageIdsAtom);

  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const frameIdRef = useRef<number>(0);

  // Shader renderer for processing images with shader layers
  const { getProcessedImage } = useShaderRenderer();

  // Load image into cache
  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const cached = imageCacheRef.current.get(url);
      if (cached && cached.complete) {
        resolve(cached);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageCacheRef.current.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }, []);

  // Preload all images
  useEffect(() => {
    images.forEach((image) => {
      if (!imageCacheRef.current.has(image.url)) {
        loadImage(image.url).catch(console.error);
      }
    });
  }, [images, loadImage]);

  // Draw grid
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, transform: CanvasTransform) => {
      if (!gridVisible) return;

      const { width, height } = ctx.canvas;
      const { offsetX, offsetY, scale } = transform;

      // Get adaptive grid size based on zoom
      let gridSize: number = GRID_THRESHOLDS[0].gridSize;
      for (const threshold of GRID_THRESHOLDS) {
        if (scale < threshold.maxScale) {
          gridSize = threshold.gridSize;
          break;
        }
      }

      // Calculate visible grid range
      const startX = Math.floor(-offsetX / scale / gridSize) * gridSize;
      const startY = Math.floor(-offsetY / scale / gridSize) * gridSize;
      const endX = Math.ceil((width - offsetX) / scale / gridSize) * gridSize;
      const endY = Math.ceil((height - offsetY) / scale / gridSize) * gridSize;

      ctx.save();

      // Draw minor grid lines
      ctx.strokeStyle = GRID_COLORS.minor;
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let x = startX; x <= endX; x += gridSize) {
        if (x % (gridSize * MAJOR_GRID_INTERVAL) === 0) continue;
        const screenX = x * scale + offsetX;
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, height);
      }

      for (let y = startY; y <= endY; y += gridSize) {
        if (y % (gridSize * MAJOR_GRID_INTERVAL) === 0) continue;
        const screenY = y * scale + offsetY;
        ctx.moveTo(0, screenY);
        ctx.lineTo(width, screenY);
      }

      ctx.stroke();

      // Draw major grid lines
      ctx.strokeStyle = GRID_COLORS.major;
      ctx.lineWidth = 1;
      ctx.beginPath();

      const majorGridSize = gridSize * MAJOR_GRID_INTERVAL;
      const majorStartX = Math.floor(-offsetX / scale / majorGridSize) * majorGridSize;
      const majorStartY = Math.floor(-offsetY / scale / majorGridSize) * majorGridSize;

      for (let x = majorStartX; x <= endX; x += majorGridSize) {
        const screenX = x * scale + offsetX;
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, height);
      }

      for (let y = majorStartY; y <= endY; y += majorGridSize) {
        const screenY = y * scale + offsetY;
        ctx.moveTo(0, screenY);
        ctx.lineTo(width, screenY);
      }

      ctx.stroke();
      ctx.restore();
    },
    [gridVisible]
  );

  // Draw images (with shader processing)
  const drawImages = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      images: CanvasImage[],
      transform: CanvasTransform
    ) => {
      const { offsetX, offsetY, scale } = transform;

      for (const image of images) {
        if (!image.visible) continue;

        const cachedImg = imageCacheRef.current.get(image.url);
        if (!cachedImg || !cachedImg.complete) continue;

        const screenX = image.position.x * scale + offsetX;
        const screenY = image.position.y * scale + offsetY;
        const screenWidth = image.size.width * scale;
        const screenHeight = image.size.height * scale;

        // Get processed image if there are shader layers
        let imageToDraw: HTMLImageElement | HTMLCanvasElement = cachedImg;
        if (image.shaderLayers.length > 0) {
          imageToDraw = getProcessedImage(
            cachedImg,
            image.shaderLayers,
            Math.ceil(screenWidth),
            Math.ceil(screenHeight)
          );
        }

        ctx.drawImage(imageToDraw, screenX, screenY, screenWidth, screenHeight);
      }
    },
    [getProcessedImage]
  );

  // Draw selection UI
  const drawSelection = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      images: CanvasImage[],
      selectedIds: string[],
      transform: CanvasTransform
    ) => {
      const selectedImages = images.filter((img) => selectedIds.includes(img.id));

      for (const image of selectedImages) {
        const { offsetX, offsetY, scale } = transform;
        const screenX = image.position.x * scale + offsetX;
        const screenY = image.position.y * scale + offsetY;
        const screenWidth = image.size.width * scale;
        const screenHeight = image.size.height * scale;

        // Draw selection border
        ctx.strokeStyle = SELECTION_STYLE.strokeColor;
        ctx.lineWidth = SELECTION_STYLE.strokeWidth;
        ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

        // Draw selection fill
        ctx.fillStyle = SELECTION_STYLE.fillColor;
        ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

        // Draw resize handles
        const handles = getResizeHandles(image, transform);
        for (const [, rect] of handles) {
          ctx.fillStyle = HANDLE_STYLE.fillColor;
          ctx.strokeStyle = HANDLE_STYLE.strokeColor;
          ctx.lineWidth = HANDLE_STYLE.strokeWidth;
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
      }
    },
    []
  );

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw layers
    drawGrid(ctx, transform);
    drawImages(ctx, images, transform);
    drawSelection(ctx, images, selectedIds, transform);
  }, [canvasRef, transform, images, selectedIds, drawGrid, drawImages, drawSelection]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      frameIdRef.current = requestAnimationFrame(animate);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [render]);

  return {
    loadImage,
    render,
  };
}
