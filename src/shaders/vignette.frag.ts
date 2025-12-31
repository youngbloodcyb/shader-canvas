/**
 * Vignette fragment shader
 * Darkens edges with configurable shape and smoothness
 */

export const vignetteFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_size;
uniform float u_roundness;
uniform float u_smoothness;

out vec4 outColor;

// Signed distance to a square
float sdSquare(vec2 point, float width) {
  vec2 d = abs(point) - width;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float vignette(vec2 uv, float size, float roundness, float smoothness) {
  // Center UVs
  uv -= 0.5;

  // Calculate signed distance
  float boxSize = size * (1.0 - roundness);
  float dist = sdSquare(uv, boxSize) - (size * roundness);

  return 1.0 - smoothstep(0.0, smoothness, dist);
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);

  // Calculate vignette factor
  float v = vignette(v_texCoord, u_size, u_roundness, u_smoothness);

  // Apply vignette by darkening
  outColor = vec4(texel.rgb * v, texel.a);
}
`;
