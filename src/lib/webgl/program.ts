/**
 * WebGL shader program compilation utilities
 */

/**
 * Compile a shader from source
 */
export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error("Failed to create shader");
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * Create a shader program from vertex and fragment shaders
 */
export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    console.error("Failed to create program");
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  // Clean up shaders after linking
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

/**
 * Get uniform location with error handling
 */
export function getUniformLocation(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string
): WebGLUniformLocation | null {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    console.warn(`Uniform '${name}' not found in shader program`);
  }
  return location;
}

/**
 * Get attribute location with error handling
 */
export function getAttribLocation(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string
): number {
  const location = gl.getAttribLocation(program, name);
  if (location === -1) {
    console.warn(`Attribute '${name}' not found in shader program`);
  }
  return location;
}

/**
 * Cached shader program manager
 */
export class ShaderProgramManager {
  private gl: WebGL2RenderingContext;
  private programs: Map<string, WebGLProgram> = new Map();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  /**
   * Get or create a shader program
   */
  getProgram(
    key: string,
    vertexSource: string,
    fragmentSource: string
  ): WebGLProgram | null {
    if (this.programs.has(key)) {
      return this.programs.get(key)!;
    }

    const program = createProgram(this.gl, vertexSource, fragmentSource);
    if (program) {
      this.programs.set(key, program);
    }
    return program;
  }

  /**
   * Delete all cached programs
   */
  dispose(): void {
    for (const program of this.programs.values()) {
      this.gl.deleteProgram(program);
    }
    this.programs.clear();
  }
}
