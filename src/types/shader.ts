/**
 * Base properties shared by all shader layers
 */
interface ShaderLayerBase {
  id: string;
  enabled: boolean;
  order: number;
}

/**
 * Brightness shader - adjusts overall brightness
 */
export interface BrightnessShader extends ShaderLayerBase {
  type: "brightness";
  properties: {
    /** -1 (darker) to 1 (brighter), 0 = unchanged */
    value: number;
  };
}

/**
 * Contrast shader - adjusts contrast
 */
export interface ContrastShader extends ShaderLayerBase {
  type: "contrast";
  properties: {
    /** 0 (no contrast) to 2 (high contrast), 1 = unchanged */
    value: number;
  };
}

/**
 * Blur shader - Gaussian blur effect
 */
export interface BlurShader extends ShaderLayerBase {
  type: "blur";
  properties: {
    /** Blur radius in pixels (0-20) */
    radius: number;
    /** Number of samples for quality (4-16) */
    quality: number;
  };
}

/**
 * Saturation shader - adjusts color saturation
 */
export interface SaturationShader extends ShaderLayerBase {
  type: "saturation";
  properties: {
    /** 0 (grayscale) to 2 (oversaturated), 1 = unchanged */
    value: number;
  };
}

/**
 * Hue rotation shader - rotates the color hue
 */
export interface HueRotateShader extends ShaderLayerBase {
  type: "hue-rotate";
  properties: {
    /** Rotation in degrees (0-360) */
    degrees: number;
  };
}

/**
 * Invert shader - inverts colors
 */
export interface InvertShader extends ShaderLayerBase {
  type: "invert";
  properties: {
    /** Amount of inversion (0-1) */
    amount: number;
  };
}

/**
 * Discriminated union of all shader types.
 * To add a new shader:
 * 1. Create a new interface extending ShaderLayerBase
 * 2. Add it to this union
 * 3. Add default properties in SHADER_DEFAULTS
 */
export type ShaderLayer =
  | BrightnessShader
  | ContrastShader
  | BlurShader
  | SaturationShader
  | HueRotateShader
  | InvertShader;

/**
 * Extract shader type string literals
 */
export type ShaderType = ShaderLayer["type"];

/**
 * Get properties type for a specific shader type
 */
export type ShaderProperties<T extends ShaderType> = Extract<
  ShaderLayer,
  { type: T }
>["properties"];

/**
 * Default properties for each shader type
 */
export const SHADER_DEFAULTS: {
  [K in ShaderType]: ShaderProperties<K>;
} = {
  brightness: { value: 0 },
  contrast: { value: 1 },
  blur: { radius: 0, quality: 8 },
  saturation: { value: 1 },
  "hue-rotate": { degrees: 0 },
  invert: { amount: 0 },
};

/**
 * Human-readable labels for shader types
 */
export const SHADER_LABELS: Record<ShaderType, string> = {
  brightness: "Brightness",
  contrast: "Contrast",
  blur: "Blur",
  saturation: "Saturation",
  "hue-rotate": "Hue Rotate",
  invert: "Invert",
};

/**
 * Create a new shader layer with default properties
 */
export function createShaderLayer<T extends ShaderType>(
  type: T,
  id: string,
  order: number
): Extract<ShaderLayer, { type: T }> {
  return {
    id,
    type,
    enabled: true,
    order,
    properties: { ...SHADER_DEFAULTS[type] },
  } as Extract<ShaderLayer, { type: T }>;
}
