/**
 * Blend mode fragment shader
 * Blends image with a solid color using various blend modes
 */

export const blendModeFragmentShader = `#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec3 u_blendColor;
uniform float u_opacity;
uniform int u_mode;

out vec4 outColor;

// Blend mode functions
float blendMultiply(float base, float blend) {
  return base * blend;
}

float blendScreen(float base, float blend) {
  return 1.0 - ((1.0 - base) * (1.0 - blend));
}

float blendOverlay(float base, float blend) {
  return base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}

float blendSoftLight(float base, float blend) {
  return (blend < 0.5)
    ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend))
    : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
}

float blendHardLight(float base, float blend) {
  return blend < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
}

float blendColorDodge(float base, float blend) {
  return (blend == 1.0) ? blend : min(base / (1.0 - blend), 1.0);
}

float blendColorBurn(float base, float blend) {
  return (blend == 0.0) ? blend : max((1.0 - ((1.0 - base) / blend)), 0.0);
}

vec3 applyBlend(vec3 base, vec3 blend, int mode) {
  vec3 result;

  if (mode == 0) { // multiply
    result = vec3(
      blendMultiply(base.r, blend.r),
      blendMultiply(base.g, blend.g),
      blendMultiply(base.b, blend.b)
    );
  } else if (mode == 1) { // screen
    result = vec3(
      blendScreen(base.r, blend.r),
      blendScreen(base.g, blend.g),
      blendScreen(base.b, blend.b)
    );
  } else if (mode == 2) { // overlay
    result = vec3(
      blendOverlay(base.r, blend.r),
      blendOverlay(base.g, blend.g),
      blendOverlay(base.b, blend.b)
    );
  } else if (mode == 3) { // soft-light
    result = vec3(
      blendSoftLight(base.r, blend.r),
      blendSoftLight(base.g, blend.g),
      blendSoftLight(base.b, blend.b)
    );
  } else if (mode == 4) { // hard-light
    result = vec3(
      blendHardLight(base.r, blend.r),
      blendHardLight(base.g, blend.g),
      blendHardLight(base.b, blend.b)
    );
  } else if (mode == 5) { // color-dodge
    result = vec3(
      blendColorDodge(base.r, blend.r),
      blendColorDodge(base.g, blend.g),
      blendColorDodge(base.b, blend.b)
    );
  } else if (mode == 6) { // color-burn
    result = vec3(
      blendColorBurn(base.r, blend.r),
      blendColorBurn(base.g, blend.g),
      blendColorBurn(base.b, blend.b)
    );
  } else {
    result = base;
  }

  return result;
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);

  // Apply blend mode
  vec3 blended = applyBlend(texel.rgb, u_blendColor, u_mode);

  // Mix with original based on opacity
  vec3 result = mix(texel.rgb, blended, u_opacity);

  outColor = vec4(result, texel.a);
}
`;

/**
 * Blend mode name to integer mapping for shader uniform
 */
export const BLEND_MODE_VALUES: Record<string, number> = {
  "multiply": 0,
  "screen": 1,
  "overlay": 2,
  "soft-light": 3,
  "hard-light": 4,
  "color-dodge": 5,
  "color-burn": 6,
};
