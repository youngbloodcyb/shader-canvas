/**
 * Bloom fragment shader
 * Soft glow effect with HDR tone mapping
 */
export const bloomFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
uniform float u_exposure;

/**
 * Calculate luminance from RGB
 */
float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

/**
 * Gaussian blur for bloom extraction
 */
vec3 bloomBlur(vec2 uv, float radius) {
  vec2 texelSize = 1.0 / u_resolution;
  vec3 result = vec3(0.0);
  float totalWeight = 0.0;

  // Multi-ring gaussian sampling
  const int SAMPLES = 12;
  float angleStep = 6.28318530718 / float(SAMPLES);

  // Center sample - extract bright areas
  vec4 centerColor = texture(u_image, uv);
  float centerLum = luminance(centerColor.rgb);
  float centerBright = smoothstep(u_threshold, u_threshold + 0.2, centerLum);
  vec3 centerBloom = centerColor.rgb * centerBright;
  result += centerBloom * 2.0;
  totalWeight += 2.0;

  // Sample in expanding rings
  for (int ring = 1; ring <= 4; ring++) {
    float ringRadius = radius * float(ring) / 4.0;
    float ringWeight = exp(-float(ring) * 0.4);

    for (int i = 0; i < SAMPLES; i++) {
      float angle = float(i) * angleStep + float(ring) * 0.3;
      vec2 offset = vec2(cos(angle), sin(angle)) * ringRadius * texelSize;

      vec4 sampleColor = texture(u_image, uv + offset);
      float sampleLum = luminance(sampleColor.rgb);

      // Extract bright areas with soft threshold
      float bright = smoothstep(u_threshold, u_threshold + 0.2, sampleLum);
      vec3 bloomSample = sampleColor.rgb * bright;

      result += bloomSample * ringWeight;
      totalWeight += ringWeight;
    }
  }

  return result / totalWeight;
}

void main() {
  vec4 color = texture(u_image, v_texCoord);
  vec3 hdrColor = color.rgb;

  // Get bloom (blurred bright areas)
  vec3 bloomColor = bloomBlur(v_texCoord, u_radius);

  // Additive blending
  hdrColor += bloomColor * u_intensity;

  // HDR tone mapping (exposure)
  vec3 mapped = vec3(1.0) - exp(-hdrColor * u_exposure);

  fragColor = vec4(mapped, color.a);
}
`;
