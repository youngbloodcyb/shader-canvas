/**
 * Halation fragment shader
 * Creates film-like glow on bright areas with red-orange tint
 */
export const halationFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_threshold;
uniform float u_intensity;
uniform float u_spread;
uniform vec3 u_tint;

/**
 * Calculate luminance from RGB
 */
float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

/**
 * Gaussian blur sample for bright areas
 * Samples in a circular pattern with gaussian weights
 */
vec3 blurBrightAreas(vec2 uv, float radius) {
  vec2 texelSize = 1.0 / u_resolution;
  vec3 result = vec3(0.0);
  float totalWeight = 0.0;

  // 13-tap gaussian-like kernel
  const int SAMPLES = 13;
  float angleStep = 6.28318530718 / float(SAMPLES);

  // Center sample
  vec4 centerColor = texture(u_image, uv);
  float centerLum = luminance(centerColor.rgb);
  float centerBright = smoothstep(u_threshold - 0.1, u_threshold + 0.1, centerLum);
  result += centerColor.rgb * centerBright;
  totalWeight += 1.0;

  // Radial samples at multiple distances
  for (int ring = 1; ring <= 3; ring++) {
    float ringRadius = radius * float(ring) / 3.0;
    float ringWeight = exp(-float(ring) * 0.5);

    for (int i = 0; i < SAMPLES; i++) {
      float angle = float(i) * angleStep + float(ring) * 0.5;
      vec2 offset = vec2(cos(angle), sin(angle)) * ringRadius * texelSize;

      vec4 sampleColor = texture(u_image, uv + offset);
      float sampleLum = luminance(sampleColor.rgb);

      // Only include bright areas
      float bright = smoothstep(u_threshold - 0.1, u_threshold + 0.1, sampleLum);

      result += sampleColor.rgb * bright * ringWeight;
      totalWeight += ringWeight;
    }
  }

  return result / totalWeight;
}

void main() {
  vec4 color = texture(u_image, v_texCoord);

  // Get blurred bright areas
  vec3 bloom = blurBrightAreas(v_texCoord, u_spread);

  // Tint the bloom with halation color
  vec3 halation = bloom * u_tint;

  // Add halation to original with intensity control
  vec3 result = color.rgb + halation * u_intensity;

  fragColor = vec4(result, color.a);
}
`;
