/**
 * Color correction fragment shader
 * Implements brightness, contrast, exposure, and saturation adjustments
 * Based on: https://maximmcnair.com/p/webgl-color-correction
 */
export const colorCorrectionFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;

// Color correction uniforms
uniform float u_brightness; // -1 to 1, 0 = unchanged
uniform float u_contrast;   // -1 to 1, 0 = unchanged
uniform float u_exposure;   // 0.5 to 2, 1 = unchanged
uniform float u_saturation; // 0 to 2, 1 = unchanged

in vec2 v_texCoord;
out vec4 outColor;

// Brightness adjustment - adds value to RGB
vec3 adjustBrightness(vec3 color, float value) {
  return color + value;
}

// Exposure adjustment - multiplies RGB
vec3 adjustExposure(vec3 color, float value) {
  return color * value;
}

// Contrast adjustment - expands/compresses around 0.5
vec3 adjustContrast(vec3 color, float value) {
  return 0.5 + (1.0 + value) * (color - 0.5);
}

// Saturation adjustment using luminance
vec3 adjustSaturation(vec3 color, float value) {
  // sRGB colorspace luminosity factor (WCAG standard)
  vec3 luminanceWeight = vec3(0.2126, 0.7152, 0.0722);
  float luminance = dot(color, luminanceWeight);
  vec3 grayscale = vec3(luminance);
  return mix(grayscale, color, value);
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  vec3 color = texel.rgb;

  // Apply adjustments in order
  color = adjustBrightness(color, u_brightness);
  color = adjustExposure(color, u_exposure);
  color = adjustContrast(color, u_contrast);
  color = adjustSaturation(color, u_saturation);

  // Clamp to valid range
  color = clamp(color, 0.0, 1.0);

  outColor = vec4(color, texel.a);
}
`;

/**
 * Simple passthrough fragment shader
 */
export const passthroughFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_texCoord);
}
`;

/**
 * Individual brightness shader
 */
export const brightnessFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_value; // -1 to 1

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  vec3 color = texel.rgb + u_value;
  outColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
`;

/**
 * Individual contrast shader
 */
export const contrastFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_value; // -1 to 1

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  vec3 color = 0.5 + (1.0 + u_value) * (texel.rgb - 0.5);
  outColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
`;

/**
 * Individual exposure shader
 */
export const exposureFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_value; // 0.5 to 2

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  vec3 color = texel.rgb * u_value;
  outColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
`;

/**
 * Individual saturation shader
 */
export const saturationFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_value; // 0 to 2

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  vec3 luminanceWeight = vec3(0.2126, 0.7152, 0.0722);
  float luminance = dot(texel.rgb, luminanceWeight);
  vec3 grayscale = vec3(luminance);
  vec3 color = mix(grayscale, texel.rgb, u_value);
  outColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
`;

/**
 * Invert colors shader
 */
export const invertFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform float u_amount; // 0 to 1

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  vec3 inverted = 1.0 - texel.rgb;
  vec3 color = mix(texel.rgb, inverted, u_amount);
  outColor = vec4(color, texel.a);
}
`;
