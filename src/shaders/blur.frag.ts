/**
 * Gaussian blur fragment shader
 * Uses a separable 2-pass approach approximation with weighted samples
 */
export const blurFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_radius;
uniform float u_quality;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec4 result = vec4(0.0);
  float totalWeight = 0.0;

  // Number of samples based on quality
  int samples = int(u_quality);

  // If radius is 0, just return the original color
  if (u_radius < 0.001) {
    fragColor = texture(u_texture, v_texCoord);
    return;
  }

  // Gaussian-like blur with box sampling
  for (int x = -samples; x <= samples; x++) {
    for (int y = -samples; y <= samples; y++) {
      vec2 offset = vec2(float(x), float(y)) * texelSize * u_radius;

      // Gaussian weight approximation based on distance
      float dist = length(vec2(float(x), float(y))) / float(samples);
      float weight = exp(-dist * dist * 2.0);

      result += texture(u_texture, v_texCoord + offset) * weight;
      totalWeight += weight;
    }
  }

  fragColor = result / totalWeight;
}
`;
