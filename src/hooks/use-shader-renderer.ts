import { useCallback, useEffect, useRef } from "react";
import { createWebGLContext, ShaderCompositor } from "@/lib/webgl";
import type { ShaderLayer } from "@/types/shader";

/**
 * Hook for WebGL shader rendering
 * Creates an offscreen canvas to process images with shaders
 */
export function useShaderRenderer() {
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const compositorRef = useRef<ShaderCompositor | null>(null);
  const processedCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Initialize offscreen WebGL context
  useEffect(() => {
    // Create offscreen canvas for shader processing
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    offscreenCanvasRef.current = canvas;

    const gl = createWebGLContext(canvas);
    if (!gl) {
      console.error("Failed to create WebGL context for shader processing");
      return;
    }

    glRef.current = gl;
    compositorRef.current = new ShaderCompositor(gl);

    return () => {
      compositorRef.current?.dispose();
      compositorRef.current = null;
      glRef.current = null;
      offscreenCanvasRef.current = null;
      processedCacheRef.current.clear();
    };
  }, []);

  /**
   * Process an image through shader layers and return processed canvas
   */
  const processImage = useCallback(
    (
      image: HTMLImageElement,
      layers: ShaderLayer[],
      width: number,
      height: number
    ): HTMLCanvasElement | null => {
      const canvas = offscreenCanvasRef.current;
      const gl = glRef.current;
      const compositor = compositorRef.current;

      if (!canvas || !gl || !compositor || !image.complete) {
        return null;
      }

      // Filter to only enabled layers with effects
      const activeLayers = layers.filter((l) => l.enabled);
      if (activeLayers.length === 0) {
        return null; // No processing needed
      }

      // Resize offscreen canvas if needed
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      compositor.resize(width, height);
      compositor.render(image, activeLayers);

      // Copy WebGL canvas to a new 2D canvas for use in main canvas
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = width;
      outputCanvas.height = height;
      const ctx = outputCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
      }

      return outputCanvas;
    },
    []
  );

  /**
   * Get a cache key for an image + shader combination
   */
  const getCacheKey = useCallback(
    (imageUrl: string, layers: ShaderLayer[]): string => {
      const layerHash = layers
        .filter((l) => l.enabled)
        .map((l) => `${l.id}:${JSON.stringify(l.properties)}`)
        .join("|");
      return `${imageUrl}::${layerHash}`;
    },
    []
  );

  /**
   * Get processed image from cache or process it
   */
  const getProcessedImage = useCallback(
    (
      image: HTMLImageElement,
      layers: ShaderLayer[],
      width: number,
      height: number
    ): HTMLCanvasElement | HTMLImageElement => {
      // If no active layers, return original image
      const activeLayers = layers.filter((l) => l.enabled);
      if (activeLayers.length === 0) {
        return image;
      }

      const cacheKey = getCacheKey(image.src, layers);

      // Check cache
      const cached = processedCacheRef.current.get(cacheKey);
      if (cached && cached.width === width && cached.height === height) {
        return cached;
      }

      // Process and cache
      const processed = processImage(image, layers, width, height);
      if (processed) {
        // Limit cache size
        if (processedCacheRef.current.size > 50) {
          const firstKey = processedCacheRef.current.keys().next().value;
          if (firstKey) processedCacheRef.current.delete(firstKey);
        }
        processedCacheRef.current.set(cacheKey, processed);
        return processed;
      }

      return image;
    },
    [getCacheKey, processImage]
  );

  /**
   * Clear the processed image cache
   */
  const clearCache = useCallback(() => {
    processedCacheRef.current.clear();
  }, []);

  /**
   * Invalidate cache for a specific image
   */
  const invalidateCache = useCallback((imageUrl: string) => {
    for (const key of processedCacheRef.current.keys()) {
      if (key.startsWith(imageUrl)) {
        processedCacheRef.current.delete(key);
      }
    }
  }, []);

  /**
   * Load a LUT image for use in LUT shader
   */
  const loadLutImage = useCallback((url: string) => {
    compositorRef.current?.loadLutImage(url);
  }, []);

  /**
   * Check if a LUT image is loaded
   */
  const hasLutImage = useCallback((url: string): boolean => {
    return compositorRef.current?.hasLutImage(url) ?? false;
  }, []);

  return {
    processImage,
    getProcessedImage,
    clearCache,
    invalidateCache,
    loadLutImage,
    hasLutImage,
    isReady: glRef.current !== null,
  };
}
