/**
 * Film grain fragment shader
 * Adds realistic film grain noise with luminance-aware blending
 */

export const filmGrainFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_intensity;
uniform float u_size;
uniform vec2 u_resolution;

out vec4 outColor;

// Pseudo-random hash function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Calculate luminance
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// Soft light blend for single channel
float blendSoftLight(float base, float blend) {
  return (blend < 0.5)
    ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend))
    : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);

  // Generate grain based on scaled coordinates
  vec2 grainCoord = v_texCoord * u_resolution / u_size;
  float grain = hash(grainCoord) - 0.5;

  // Scale grain by intensity
  grain *= u_intensity;

  // Calculate luminance for adaptive blending
  float luminance = luma(texel.rgb);

  // Reduce grain effect in very dark and very bright areas
  float response = smoothstep(0.05, 0.5, luminance) * smoothstep(0.95, 0.5, luminance);

  // Apply grain using soft light blend
  vec3 grainColor = vec3(0.5 + grain);
  vec3 blended = vec3(
    blendSoftLight(texel.r, grainColor.r),
    blendSoftLight(texel.g, grainColor.g),
    blendSoftLight(texel.b, grainColor.b)
  );

  // Mix based on luminance response
  vec3 result = mix(texel.rgb, blended, response);

  outColor = vec4(result, texel.a);
}
`;
