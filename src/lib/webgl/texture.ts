/**
 * WebGL texture utilities
 */

/**
 * Create a texture from an image element
 */
export function createTextureFromImage(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement | HTMLCanvasElement
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) {
    console.error("Failed to create texture");
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Upload image data
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  return texture;
}

/**
 * Create an empty texture for framebuffer attachment
 */
export function createEmptyTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) {
    console.error("Failed to create texture");
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Allocate empty texture
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  return texture;
}

/**
 * Update an existing texture with new image data
 */
export function updateTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  image: HTMLImageElement | HTMLCanvasElement
): void {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

/**
 * Bind a texture to a texture unit
 */
export function bindTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  unit: number = 0
): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

/**
 * Texture cache for managing image textures
 */
export class TextureCache {
  private gl: WebGL2RenderingContext;
  private textures: Map<string, WebGLTexture> = new Map();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * Get or create a texture for an image URL
   */
  getTexture(url: string, image: HTMLImageElement): WebGLTexture | null {
    if (this.textures.has(url)) {
      return this.textures.get(url)!;
    }

    const texture = createTextureFromImage(this.gl, image);
    if (texture) {
      this.textures.set(url, texture);
    }
    return texture;
  }

  /**
   * Update a texture if image changed
   */
  updateTexture(url: string, image: HTMLImageElement): void {
    const texture = this.textures.get(url);
    if (texture) {
      updateTexture(this.gl, texture, image);
    }
  }

  /**
   * Remove a texture from cache
   */
  removeTexture(url: string): void {
    const texture = this.textures.get(url);
    if (texture) {
      this.gl.deleteTexture(texture);
      this.textures.delete(url);
    }
  }

  /**
   * Delete all cached textures
   */
  dispose(): void {
    for (const texture of this.textures.values()) {
      this.gl.deleteTexture(texture);
    }
    this.textures.clear();
  }
}
