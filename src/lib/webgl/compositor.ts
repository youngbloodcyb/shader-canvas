/**
 * Shader compositor for applying multiple shader layers
 */

import type { ShaderLayer } from "@/types/shader";
import { ShaderProgramManager, getUniformLocation } from "./program";
import { TextureCache, bindTexture } from "./texture";
import { PingPongBuffer } from "./framebuffer";
import { QuadRenderer } from "./quad";
import { clearCanvas } from "./context";
import {
  quadVertexShader,
  colorCorrectionFragmentShader,
  brightnessFragmentShader,
  contrastFragmentShader,
  exposureFragmentShader,
  saturationFragmentShader,
  invertFragmentShader,
  hueRotateFragmentShader,
  blendModeFragmentShader,
  BLEND_MODE_VALUES,
  passthroughFragmentShader,
} from "@/shaders";

/**
 * Get the fragment shader for a specific shader type
 */
function getFragmentShader(type: ShaderLayer["type"]): string {
  switch (type) {
    case "brightness":
      return brightnessFragmentShader;
    case "contrast":
      return contrastFragmentShader;
    case "exposure":
      return exposureFragmentShader;
    case "saturation":
      return saturationFragmentShader;
    case "invert":
      return invertFragmentShader;
    case "hue-rotate":
      return hueRotateFragmentShader;
    case "blend-mode":
      return blendModeFragmentShader;
    case "color-correction":
      return colorCorrectionFragmentShader;
    default:
      return passthroughFragmentShader;
  }
}

/**
 * Set uniforms for a specific shader layer
 */
function setShaderUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  layer: ShaderLayer
): void {
  switch (layer.type) {
    case "brightness": {
      const loc = getUniformLocation(gl, program, "u_value");
      if (loc) gl.uniform1f(loc, layer.properties.value);
      break;
    }
    case "contrast": {
      const loc = getUniformLocation(gl, program, "u_value");
      if (loc) gl.uniform1f(loc, layer.properties.value);
      break;
    }
    case "exposure": {
      const loc = getUniformLocation(gl, program, "u_value");
      if (loc) gl.uniform1f(loc, layer.properties.value);
      break;
    }
    case "saturation": {
      const loc = getUniformLocation(gl, program, "u_value");
      if (loc) gl.uniform1f(loc, layer.properties.value);
      break;
    }
    case "invert": {
      const loc = getUniformLocation(gl, program, "u_amount");
      if (loc) gl.uniform1f(loc, layer.properties.amount);
      break;
    }
    case "hue-rotate": {
      const loc = getUniformLocation(gl, program, "u_degrees");
      if (loc) gl.uniform1f(loc, layer.properties.degrees);
      break;
    }
    case "blend-mode": {
      const colorLoc = getUniformLocation(gl, program, "u_blendColor");
      const opacityLoc = getUniformLocation(gl, program, "u_opacity");
      const modeLoc = getUniformLocation(gl, program, "u_mode");
      if (colorLoc) gl.uniform3f(colorLoc, layer.properties.color[0], layer.properties.color[1], layer.properties.color[2]);
      if (opacityLoc) gl.uniform1f(opacityLoc, layer.properties.opacity);
      if (modeLoc) gl.uniform1i(modeLoc, BLEND_MODE_VALUES[layer.properties.mode] ?? 0);
      break;
    }
    case "color-correction": {
      const brightnessLoc = getUniformLocation(gl, program, "u_brightness");
      const contrastLoc = getUniformLocation(gl, program, "u_contrast");
      const exposureLoc = getUniformLocation(gl, program, "u_exposure");
      const saturationLoc = getUniformLocation(gl, program, "u_saturation");

      if (brightnessLoc) gl.uniform1f(brightnessLoc, layer.properties.brightness);
      if (contrastLoc) gl.uniform1f(contrastLoc, layer.properties.contrast);
      if (exposureLoc) gl.uniform1f(exposureLoc, layer.properties.exposure);
      if (saturationLoc) gl.uniform1f(saturationLoc, layer.properties.saturation);
      break;
    }
  }
}

/**
 * Check if a shader layer has any effect (non-default values)
 */
function hasEffect(layer: ShaderLayer): boolean {
  if (!layer.enabled) return false;

  switch (layer.type) {
    case "brightness":
      return layer.properties.value !== 0;
    case "contrast":
      return layer.properties.value !== 0;
    case "exposure":
      return layer.properties.value !== 1;
    case "saturation":
      return layer.properties.value !== 1;
    case "invert":
      return layer.properties.amount > 0;
    case "color-correction":
      return (
        layer.properties.brightness !== 0 ||
        layer.properties.contrast !== 0 ||
        layer.properties.exposure !== 1 ||
        layer.properties.saturation !== 1
      );
    case "blur":
      return layer.properties.radius > 0;
    case "hue-rotate":
      return layer.properties.degrees !== 0;
    case "blend-mode":
      return layer.properties.opacity > 0;
    default:
      return true;
  }
}

/**
 * Shader compositor class for multi-pass rendering
 */
export class ShaderCompositor {
  private gl: WebGL2RenderingContext;
  private programManager: ShaderProgramManager;
  private textureCache: TextureCache;
  private pingPong: PingPongBuffer;
  private quadRenderer: QuadRenderer;
  private width = 0;
  private height = 0;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.programManager = new ShaderProgramManager(gl);
    this.textureCache = new TextureCache(gl);
    this.pingPong = new PingPongBuffer(gl);
    this.quadRenderer = new QuadRenderer(gl);
  }

  /**
   * Resize the compositor framebuffers
   */
  resize(width: number, height: number): void {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.pingPong.resize(width, height);
  }

  /**
   * Apply shader layers to an image and render to canvas
   */
  render(
    image: HTMLImageElement,
    layers: ShaderLayer[]
  ): void {
    const gl = this.gl;

    // Get or create texture for image
    const imageTexture = this.textureCache.getTexture(image.src, image);
    if (!imageTexture) return;

    // Filter to only layers with effect
    const activeLayers = layers
      .filter(hasEffect)
      .sort((a, b) => a.order - b.order);

    // If no active layers, just render the image directly
    if (activeLayers.length === 0) {
      this.renderPassthrough(imageTexture);
      return;
    }

    // Ensure framebuffers are sized correctly
    this.pingPong.resize(this.width, this.height);
    this.pingPong.reset();

    // First pass: render image to first framebuffer
    let inputTexture = imageTexture;

    // Apply each shader layer
    for (let i = 0; i < activeLayers.length; i++) {
      const layer = activeLayers[i];
      const isLastPass = i === activeLayers.length - 1;

      // Get shader program
      const fragmentShader = getFragmentShader(layer.type);
      const program = this.programManager.getProgram(
        layer.type,
        quadVertexShader,
        fragmentShader
      );
      if (!program) continue;

      gl.useProgram(program);

      // Set up quad for this program
      this.quadRenderer.setupForProgram(program);

      // Bind to output framebuffer (or screen for last pass)
      if (isLastPass) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.width, this.height);
      } else {
        const writeFb = this.pingPong.getWriteFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFb);
        gl.viewport(0, 0, this.width, this.height);
      }

      // Clear and set up
      clearCanvas(gl);

      // Bind input texture
      bindTexture(gl, inputTexture, 0);
      const texLoc = getUniformLocation(gl, program, "u_image");
      if (texLoc) gl.uniform1i(texLoc, 0);

      // Set resolution uniform if needed
      const resLoc = getUniformLocation(gl, program, "u_resolution");
      if (resLoc) gl.uniform2f(resLoc, this.width, this.height);

      // Set shader-specific uniforms
      setShaderUniforms(gl, program, layer);

      // Set flipY uniform - only flip on first pass (image texture)
      // Framebuffer textures are already in correct orientation
      const flipYLoc = getUniformLocation(gl, program, "u_flipY");
      if (flipYLoc) gl.uniform1i(flipYLoc, i === 0 ? 1 : 0);

      // Draw quad
      this.quadRenderer.draw();

      // Swap buffers for next pass
      if (!isLastPass) {
        this.pingPong.swap();
        inputTexture = this.pingPong.getReadTexture()!;
      }
    }
  }

  /**
   * Render image without any effects
   */
  private renderPassthrough(texture: WebGLTexture): void {
    const gl = this.gl;

    const program = this.programManager.getProgram(
      "passthrough",
      quadVertexShader,
      passthroughFragmentShader
    );
    if (!program) return;

    gl.useProgram(program);
    this.quadRenderer.setupForProgram(program);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    clearCanvas(gl);

    bindTexture(gl, texture, 0);
    const texLoc = getUniformLocation(gl, program, "u_image");
    if (texLoc) gl.uniform1i(texLoc, 0);

    // Flip Y for image texture
    const flipYLoc = getUniformLocation(gl, program, "u_flipY");
    if (flipYLoc) gl.uniform1i(flipYLoc, 1);

    this.quadRenderer.draw();
  }

  /**
   * Get the result as an image data URL
   */
  toDataURL(type = "image/png", quality = 0.92): string {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    return canvas.toDataURL(type, quality);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.programManager.dispose();
    this.textureCache.dispose();
    this.pingPong.dispose();
    this.quadRenderer.dispose();
  }
}
