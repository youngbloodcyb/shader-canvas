/**
 * Image export utilities
 * Exports processed images with shader effects applied
 */

import type { ShaderLayer } from "@/types/shader";
import type { CanvasImage } from "@/types/image";
import { createWebGLContext } from "@/lib/webgl/context";
import { ShaderCompositor } from "@/lib/webgl/compositor";

/**
 * Load an image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Export an image with shader effects applied
 */
export async function exportProcessedImage(
  image: CanvasImage,
  format: "png" | "jpeg" = "png",
  quality: number = 0.92
): Promise<Blob> {
  // Load the source image
  const sourceImg = await loadImage(image.url);

  // Use original size for export
  const width = image.originalSize.width;
  const height = image.originalSize.height;

  // Filter enabled layers
  const enabledLayers = image.shaderLayers.filter((l) => l.enabled);

  // If no shaders, just return the original image
  if (enabledLayers.length === 0) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    ctx.drawImage(sourceImg, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        `image/${format}`,
        quality
      );
    });
  }

  // Create offscreen WebGL canvas for processing
  const glCanvas = document.createElement("canvas");
  glCanvas.width = width;
  glCanvas.height = height;

  const gl = createWebGLContext(glCanvas);
  if (!gl) throw new Error("Failed to create WebGL context");

  const compositor = new ShaderCompositor(gl);
  compositor.resize(width, height);

  // Render with shaders
  compositor.render(sourceImg, enabledLayers);

  // Copy to 2D canvas for export
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");
  ctx.drawImage(glCanvas, 0, 0);

  // Cleanup
  compositor.dispose();

  // Convert to blob
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      `image/${format}`,
      quality
    );
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download an image with shaders applied
 */
export async function exportAndDownloadImage(
  image: CanvasImage,
  format: "png" | "jpeg" = "png"
): Promise<void> {
  const blob = await exportProcessedImage(image, format);
  const extension = format === "jpeg" ? "jpg" : "png";
  const filename = `shader-canvas-export-${Date.now()}.${extension}`;
  downloadBlob(blob, filename);
}
