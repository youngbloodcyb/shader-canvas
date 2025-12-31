/**
 * WebGL utilities exports
 */

export {
  createWebGLContext,
  resizeCanvasToDisplaySize,
  clearCanvas,
  enableBlending,
  type WebGLContextOptions,
} from "./context";

export {
  compileShader,
  createProgram,
  getUniformLocation,
  getAttribLocation,
  ShaderProgramManager,
} from "./program";

export {
  createTextureFromImage,
  createEmptyTexture,
  updateTexture,
  bindTexture,
  TextureCache,
} from "./texture";

export {
  createFramebuffer,
  resizeFramebuffer,
  deleteFramebuffer,
  PingPongBuffer,
  type Framebuffer,
} from "./framebuffer";

export {
  createQuadBuffer,
  setupQuadAttributes,
  drawQuad,
  QuadRenderer,
} from "./quad";

export { ShaderCompositor } from "./compositor";
