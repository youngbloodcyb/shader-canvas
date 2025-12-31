/**
 * Fullscreen quad for shader rendering
 */

/**
 * Create a vertex buffer for a fullscreen quad
 */
export function createQuadBuffer(gl: WebGL2RenderingContext): WebGLBuffer | null {
  const buffer = gl.createBuffer();
  if (!buffer) {
    console.error("Failed to create quad buffer");
    return null;
  }

  // Two triangles covering the entire clip space (-1 to 1)
  const vertices = new Float32Array([
    -1, -1,  // Bottom-left
     1, -1,  // Bottom-right
    -1,  1,  // Top-left
    -1,  1,  // Top-left
     1, -1,  // Bottom-right
     1,  1,  // Top-right
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  return buffer;
}

/**
 * Set up vertex attribute for position
 */
export function setupQuadAttributes(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  buffer: WebGLBuffer
): void {
  const positionLocation = gl.getAttribLocation(program, "a_position");

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
}

/**
 * Draw the fullscreen quad
 */
export function drawQuad(gl: WebGL2RenderingContext): void {
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

/**
 * Quad renderer with VAO for efficient rendering
 */
export class QuadRenderer {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject | null = null;
  private buffer: WebGLBuffer | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.init();
  }

  private init(): void {
    this.buffer = createQuadBuffer(this.gl);
    this.vao = this.gl.createVertexArray();
  }

  /**
   * Set up for a specific program
   */
  setupForProgram(program: WebGLProgram): void {
    if (!this.vao || !this.buffer) return;

    this.gl.bindVertexArray(this.vao);
    setupQuadAttributes(this.gl, program, this.buffer);
    this.gl.bindVertexArray(null);
  }

  /**
   * Draw the quad
   */
  draw(): void {
    if (!this.vao) return;

    this.gl.bindVertexArray(this.vao);
    drawQuad(this.gl);
    this.gl.bindVertexArray(null);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.buffer) {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
    }
    if (this.vao) {
      this.gl.deleteVertexArray(this.vao);
      this.vao = null;
    }
  }
}
