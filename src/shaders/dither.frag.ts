/**
 * Dither fragment shader
 * Creates halftone-like pattern using ordered Bayer dithering
 */

export const ditherFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_scale;
uniform vec2 u_resolution;

out vec4 outColor;

// 4x4 Bayer dither matrix
const int MATRIX_SIZE = 4;
const float MATRIX[16] = float[](
   0.0,  8.0,  2.0, 10.0,
  12.0,  4.0, 14.0,  6.0,
   3.0, 11.0,  1.0,  9.0,
  15.0,  7.0, 13.0,  5.0
);

// Calculate luminance using sRGB weights
float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float dither4x4(vec2 position, float luma) {
  int x = int(mod(position.x, float(MATRIX_SIZE)));
  int y = int(mod(position.y, float(MATRIX_SIZE)));
  int index = x + y * MATRIX_SIZE;

  // Normalize threshold to 0-1 range
  float threshold = (MATRIX[index] + 1.0) / 17.0;

  return luma < threshold ? 0.0 : 1.0;
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);

  // Get luminance
  float luma = luminance(texel.rgb);

  // Scale position for pattern size
  vec2 position = v_texCoord * u_resolution / u_scale;

  // Apply dithering
  float dithered = dither4x4(position, luma);

  outColor = vec4(vec3(dithered), texel.a);
}
`;
