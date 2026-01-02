/**
 * Shader export utilities
 * Generates GLSL code for shader layers
 */

import type { ShaderLayer } from "@/types/shader";
import {
  quadVertexShader,
  brightnessFragmentShader,
  contrastFragmentShader,
  exposureFragmentShader,
  saturationFragmentShader,
  invertFragmentShader,
  hueRotateFragmentShader,
  blendModeFragmentShader,
  filmGrainFragmentShader,
  duotoneFragmentShader,
  pixelateFragmentShader,
  thresholdFragmentShader,
  ditherFragmentShader,
  vignetteFragmentShader,
  chromaticAberrationFragmentShader,
  blurFragmentShader,
  lutFragmentShader,
  colorCorrectionFragmentShader,
} from "@/shaders";

/**
 * Get the fragment shader source for a layer type
 */
function getFragmentShaderSource(type: ShaderLayer["type"]): string {
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
    case "film-grain":
      return filmGrainFragmentShader;
    case "duotone":
      return duotoneFragmentShader;
    case "pixelate":
      return pixelateFragmentShader;
    case "threshold":
      return thresholdFragmentShader;
    case "dither":
      return ditherFragmentShader;
    case "vignette":
      return vignetteFragmentShader;
    case "chromatic-aberration":
      return chromaticAberrationFragmentShader;
    case "blur":
      return blurFragmentShader;
    case "lut":
      return lutFragmentShader;
    case "color-correction":
      return colorCorrectionFragmentShader;
    default:
      return "";
  }
}

/**
 * Format uniform values for a shader layer
 */
function formatUniformValues(layer: ShaderLayer): string {
  const lines: string[] = [];

  switch (layer.type) {
    case "brightness":
    case "contrast":
    case "exposure":
    case "saturation":
      lines.push(`u_value = ${layer.properties.value}`);
      break;
    case "invert":
      lines.push(`u_amount = ${layer.properties.amount}`);
      break;
    case "hue-rotate":
      lines.push(`u_degrees = ${layer.properties.degrees}`);
      break;
    case "blend-mode":
      lines.push(`u_blendColor = vec3(${layer.properties.color.join(", ")})`);
      lines.push(`u_opacity = ${layer.properties.opacity}`);
      lines.push(`u_mode = "${layer.properties.mode}"`);
      break;
    case "film-grain":
      lines.push(`u_intensity = ${layer.properties.intensity}`);
      lines.push(`u_size = ${layer.properties.size}`);
      break;
    case "duotone":
      lines.push(`u_shadowColor = vec3(${layer.properties.shadowColor.join(", ")})`);
      lines.push(`u_highlightColor = vec3(${layer.properties.highlightColor.join(", ")})`);
      break;
    case "pixelate":
      lines.push(`u_size = ${layer.properties.size}`);
      break;
    case "threshold":
      lines.push(`u_value = ${layer.properties.value}`);
      break;
    case "dither":
      lines.push(`u_scale = ${layer.properties.scale}`);
      break;
    case "vignette":
      lines.push(`u_size = ${layer.properties.size}`);
      lines.push(`u_roundness = ${layer.properties.roundness}`);
      lines.push(`u_smoothness = ${layer.properties.smoothness}`);
      break;
    case "chromatic-aberration":
      lines.push(`u_offset = ${layer.properties.offset}`);
      break;
    case "blur":
      lines.push(`u_radius = ${layer.properties.radius}`);
      lines.push(`u_quality = ${layer.properties.quality}`);
      break;
    case "lut":
      lines.push(`u_intensity = ${layer.properties.intensity}`);
      lines.push(`u_lut = <LUT texture sampler>`);
      lines.push(`u_hasLut = true`);
      break;
    case "color-correction":
      lines.push(`u_brightness = ${layer.properties.brightness}`);
      lines.push(`u_contrast = ${layer.properties.contrast}`);
      lines.push(`u_exposure = ${layer.properties.exposure}`);
      lines.push(`u_saturation = ${layer.properties.saturation}`);
      break;
  }

  return lines.join("\n");
}

/**
 * Generate exportable shader code for all layers
 */
export function generateShaderExport(layers: ShaderLayer[]): string {
  const enabledLayers = layers
    .filter((l) => l.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledLayers.length === 0) {
    return "// No shader layers configured";
  }

  const sections: string[] = [];

  // Header
  sections.push(`// Shader Canvas Export
// Generated: ${new Date().toISOString()}
// Total Layers: ${enabledLayers.length}
// ==========================================
`);

  // Vertex Shader (shared)
  sections.push(`// ==========================================
// VERTEX SHADER (shared by all passes)
// ==========================================
${quadVertexShader}
`);

  // Each layer's fragment shader
  enabledLayers.forEach((layer, index) => {
    const fragmentSource = getFragmentShaderSource(layer.type);
    const uniformValues = formatUniformValues(layer);

    sections.push(`// ==========================================
// PASS ${index + 1}: ${layer.type.toUpperCase()}
// Layer ID: ${layer.id}
// Order: ${layer.order}
// ==========================================

// Uniform Values:
// ${uniformValues.split("\n").join("\n// ")}

// Fragment Shader:
${fragmentSource}
`);
  });

  // Footer with usage notes
  sections.push(`// ==========================================
// USAGE NOTES
// ==========================================
//
// These shaders are designed for WebGL 2 (GLSL ES 3.00).
//
// Multi-pass rendering:
// - Each shader pass reads from the previous pass output
// - Use ping-pong framebuffers for intermediate results
// - First pass reads from source image texture
// - Last pass renders to screen (null framebuffer)
//
// Texture coordinate note:
// - Flip Y coordinate on first pass (image textures)
// - Subsequent passes read from framebuffers (no flip needed)
//
// Required uniforms for all shaders:
// - sampler2D u_image: Input texture
// - vec2 u_resolution: Canvas dimensions (for some effects)
// - bool u_flipY: Whether to flip Y coordinate
`);

  return sections.join("\n");
}

/**
 * Download text content as a file
 */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
