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
 * Exposure shader - adjusts exposure
 */
export interface ExposureShader extends ShaderLayerBase {
  type: "exposure";
  properties: {
    /** 0.5 (darker) to 2 (brighter), 1 = unchanged */
    value: number;
  };
}

/**
 * Color correction shader - combined adjustments
 */
export interface ColorCorrectionShader extends ShaderLayerBase {
  type: "color-correction";
  properties: {
    /** -1 to 1, 0 = unchanged */
    brightness: number;
    /** -1 to 1, 0 = unchanged */
    contrast: number;
    /** 0.5 to 2, 1 = unchanged */
    exposure: number;
    /** 0 to 2, 1 = unchanged */
    saturation: number;
  };
}

/**
 * Blend mode types
 */
export type BlendModeType = "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "color-dodge" | "color-burn";

/**
 * Blend mode shader - blends image with a color
 */
export interface BlendModeShader extends ShaderLayerBase {
  type: "blend-mode";
  properties: {
    /** Blend mode to use */
    mode: BlendModeType;
    /** Blend color RGB (0-1 each) */
    color: [number, number, number];
    /** Blend opacity (0-1) */
    opacity: number;
  };
}

/**
 * Film grain shader - adds noise texture
 */
export interface FilmGrainShader extends ShaderLayerBase {
  type: "film-grain";
  properties: {
    /** Grain intensity (0-1) */
    intensity: number;
    /** Grain size (0.5-3) */
    size: number;
  };
}

/**
 * Duotone shader - maps image to two colors
 */
export interface DuotoneShader extends ShaderLayerBase {
  type: "duotone";
  properties: {
    /** Shadow/dark color RGB (0-1 each) */
    shadowColor: [number, number, number];
    /** Highlight/light color RGB (0-1 each) */
    highlightColor: [number, number, number];
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
  | InvertShader
  | ExposureShader
  | ColorCorrectionShader
  | BlendModeShader
  | FilmGrainShader
  | DuotoneShader;

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
  contrast: { value: 0 },
  blur: { radius: 0, quality: 8 },
  saturation: { value: 1 },
  "hue-rotate": { degrees: 0 },
  invert: { amount: 0 },
  exposure: { value: 1 },
  "color-correction": {
    brightness: 0,
    contrast: 0,
    exposure: 1,
    saturation: 1,
  },
  "blend-mode": {
    mode: "multiply",
    color: [1, 0.5, 0],
    opacity: 0.5,
  },
  "film-grain": {
    intensity: 0.3,
    size: 1.5,
  },
  "duotone": {
    shadowColor: [0.1, 0.0, 0.2],
    highlightColor: [1.0, 0.9, 0.5],
  },
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
  exposure: "Exposure",
  "color-correction": "Color Correction",
  "blend-mode": "Blend Mode",
  "film-grain": "Film Grain",
  "duotone": "Duotone",
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
