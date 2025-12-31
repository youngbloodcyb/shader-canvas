/**
 * Hue rotation fragment shader
 * Converts RGB to HSB, rotates hue, converts back to RGB
 */

export const hueRotateFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_degrees;

out vec4 outColor;

// RGB to HSB conversion
vec3 rgb2hsb(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSB to RGB conversion
vec3 hsb2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);

  // Convert to HSB
  vec3 hsb = rgb2hsb(texel.rgb);

  // Rotate hue (convert degrees to 0-1 range and add)
  hsb.x = fract(hsb.x + u_degrees / 360.0);

  // Convert back to RGB
  vec3 rgb = hsb2rgb(hsb);

  outColor = vec4(rgb, texel.a);
}
`;
