/**
 * WebGL framebuffer utilities for multi-pass rendering
 */

import { createEmptyTexture } from "./texture";

export interface Framebuffer {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

/**
 * Create a framebuffer with an attached texture
 */
export function createFramebuffer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): Framebuffer | null {
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.error("Failed to create framebuffer");
    return null;
  }

  const texture = createEmptyTexture(gl, width, height);
  if (!texture) {
    gl.deleteFramebuffer(framebuffer);
    return null;
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  // Check framebuffer status
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer incomplete:", status);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    return null;
  }

  // Unbind framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture, width, height };
}

/**
 * Resize a framebuffer
 */
export function resizeFramebuffer(
  gl: WebGL2RenderingContext,
  fb: Framebuffer,
  width: number,
  height: number
): Framebuffer | null {
  if (fb.width === width && fb.height === height) {
    return fb;
  }

  // Delete old resources
  gl.deleteFramebuffer(fb.framebuffer);
  gl.deleteTexture(fb.texture);

  // Create new framebuffer
  return createFramebuffer(gl, width, height);
}

/**
 * Delete a framebuffer and its texture
 */
export function deleteFramebuffer(
  gl: WebGL2RenderingContext,
  fb: Framebuffer
): void {
  gl.deleteFramebuffer(fb.framebuffer);
  gl.deleteTexture(fb.texture);
}

/**
 * Ping-pong framebuffer pair for multi-pass rendering
 */
export class PingPongBuffer {
  private gl: WebGL2RenderingContext;
  private framebuffers: [Framebuffer | null, Framebuffer | null] = [null, null];
  private currentIndex = 0;
  private width = 0;
  private height = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * Initialize or resize framebuffers
   */
  resize(width: number, height: number): boolean {
    if (this.width === width && this.height === height) {
      return true;
    }

    this.width = width;
    this.height = height;

    // Clean up old framebuffers
    this.dispose();

    // Create new framebuffers
    this.framebuffers[0] = createFramebuffer(this.gl, width, height);
    this.framebuffers[1] = createFramebuffer(this.gl, width, height);

    return this.framebuffers[0] !== null && this.framebuffers[1] !== null;
  }

  /**
   * Get current read framebuffer (texture to sample from)
   */
  getReadTexture(): WebGLTexture | null {
    return this.framebuffers[this.currentIndex]?.texture ?? null;
  }

  /**
   * Get current write framebuffer (render target)
   */
  getWriteFramebuffer(): WebGLFramebuffer | null {
    const writeIndex = (this.currentIndex + 1) % 2;
    return this.framebuffers[writeIndex]?.framebuffer ?? null;
  }

  /**
   * Get write texture (for next pass input)
   */
  getWriteTexture(): WebGLTexture | null {
    const writeIndex = (this.currentIndex + 1) % 2;
    return this.framebuffers[writeIndex]?.texture ?? null;
  }

  /**
   * Swap read and write buffers
   */
  swap(): void {
    this.currentIndex = (this.currentIndex + 1) % 2;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    for (const fb of this.framebuffers) {
      if (fb) {
        deleteFramebuffer(this.gl, fb);
      }
    }
    this.framebuffers = [null, null];
  }
}
