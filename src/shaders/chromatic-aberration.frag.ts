/**
 * Chromatic aberration fragment shader
 * Splits RGB channels based on distance from center
 */

export const chromaticAberrationFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_offset;

out vec4 outColor;

void main() {
  // Calculate distance from center (0-0.707 for corners)
  float d = length(v_texCoord - 0.5);

  // Direction from center
  vec2 dir = normalize(v_texCoord - 0.5);

  // Sample each channel at different offsets
  // Red shifts outward, blue shifts inward
  float r = texture(u_image, v_texCoord + dir * d * u_offset).r;
  float g = texture(u_image, v_texCoord).g;
  float b = texture(u_image, v_texCoord - dir * d * u_offset).b;

  // Get alpha from original position
  float a = texture(u_image, v_texCoord).a;

  outColor = vec4(r, g, b, a);
}
`;
