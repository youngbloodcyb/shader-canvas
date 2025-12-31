/**
 * Threshold fragment shader
 * Creates binary black/white image based on luminance threshold
 */

export const thresholdFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_value;

out vec4 outColor;

// Calculate luminance using sRGB weights
float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);

  // Convert to grayscale
  float gray = luminance(texel.rgb);

  // Apply threshold - binary output
  float binary = step(u_value, gray);

  outColor = vec4(vec3(binary), texel.a);
}
`;
