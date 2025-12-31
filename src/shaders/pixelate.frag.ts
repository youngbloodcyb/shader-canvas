/**
 * Pixelate fragment shader
 * Creates blocky pixel effect by quantizing UV coordinates
 */

export const pixelateFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_size;
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
  // Calculate pixel block size in UV space
  float dx = u_size / u_resolution.x;
  float dy = u_size / u_resolution.y;

  // Quantize UV coordinates to pixel grid
  // Add 0.5 to sample from center of each block
  float x = dx * (floor(v_texCoord.x / dx) + 0.5);
  float y = dy * (floor(v_texCoord.y / dy) + 0.5);

  // Sample from quantized position
  outColor = texture(u_image, vec2(x, y));
}
`;
