/**
 * Duotone fragment shader
 * Maps image luminance to two colors
 */

export const duotoneFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec3 u_shadowColor;
uniform vec3 u_highlightColor;

out vec4 outColor;

// Calculate luminance using sRGB weights
float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);

  // Get luminance value
  float luma = luminance(texel.rgb);

  // Interpolate between shadow and highlight colors
  vec3 duotone = mix(u_shadowColor, u_highlightColor, luma);

  outColor = vec4(duotone, texel.a);
}
`;
