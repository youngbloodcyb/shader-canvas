/**
 * WebGL context management utilities
 */

export interface WebGLContextOptions {
  alpha?: boolean;
  antialias?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
}

const DEFAULT_OPTIONS: WebGLContextOptions = {
  alpha: true,
  antialias: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
};

/**
 * Create a WebGL2 rendering context
 */
export function createWebGLContext(
  canvas: HTMLCanvasElement,
  options: WebGLContextOptions = {}
): WebGL2RenderingContext | null {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const gl = canvas.getContext("webgl2", mergedOptions) as WebGL2RenderingContext | null;

  if (!gl) {
    console.error("WebGL2 is not supported in this browser");
    return null;
  }

  return gl;
}

/**
 * Resize canvas to match display size with device pixel ratio
 */
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext
): boolean {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = Math.floor(canvas.clientWidth * dpr);
  const displayHeight = Math.floor(canvas.clientHeight * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    gl.viewport(0, 0, displayWidth, displayHeight);
    return true;
  }

  return false;
}

/**
 * Clear the canvas with a color
 */
export function clearCanvas(
  gl: WebGL2RenderingContext,
  r = 0,
  g = 0,
  b = 0,
  a = 0
): void {
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

/**
 * Enable alpha blending
 */
export function enableBlending(gl: WebGL2RenderingContext): void {
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}
