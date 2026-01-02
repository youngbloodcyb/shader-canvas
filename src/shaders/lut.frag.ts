/**
 * LUT (Look-Up Table) color grading fragment shader
 * Applies color transformation using a 256x16 LUT image
 * LUT format: 16 blocks horizontally, blue increases across blocks,
 * red increases horizontally within blocks, green increases vertically
 */
export const lutFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_image;
uniform sampler2D u_lut;
uniform float u_intensity;
uniform bool u_hasLut;

void main() {
  vec4 color = texture(u_image, v_texCoord);

  // If no LUT loaded, pass through original
  if (!u_hasLut) {
    fragColor = color;
    return;
  }

  // LUT sampling based on 256x16 format (16 blocks of 16x16)
  // Blue channel determines which block (0-15)
  // Red channel determines horizontal position within block
  // Green channel determines vertical position

  float blueIndex = floor(color.b * 15.0);

  // Calculate U coordinate: block offset + red position within block
  float u = blueIndex * 16.0 + color.r * 15.0;
  u = (u + 0.5) / 256.0; // Add 0.5 for texel center sampling

  // Calculate V coordinate: green position (flipped)
  float v = 1.0 - (color.g * 15.0 + 0.5) / 16.0;

  // Sample the LUT
  vec4 gradedColor = texture(u_lut, vec2(u, v));

  // Blend between original and graded based on intensity
  fragColor = vec4(mix(color.rgb, gradedColor.rgb, u_intensity), color.a);
}
`;
