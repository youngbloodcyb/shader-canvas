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
 * Pixelate shader - creates blocky pixel effect
 */
export interface PixelateShader extends ShaderLayerBase {
  type: "pixelate";
  properties: {
    /** Pixel block size (1-100) */
    size: number;
  };
}

/**
 * Threshold shader - creates binary black/white image
 */
export interface ThresholdShader extends ShaderLayerBase {
  type: "threshold";
  properties: {
    /** Threshold value (0-1) */
    value: number;
  };
}

/**
 * Dither shader - creates halftone-like pattern
 */
export interface DitherShader extends ShaderLayerBase {
  type: "dither";
  properties: {
    /** Pattern scale (1-8) */
    scale: number;
  };
}

/**
 * Vignette shader - darkens edges
 */
export interface VignetteShader extends ShaderLayerBase {
  type: "vignette";
  properties: {
    /** Vignette size (0-0.5) */
    size: number;
    /** Corner roundness (0-1) */
    roundness: number;
    /** Edge smoothness (0-1) */
    smoothness: number;
  };
}

/**
 * Chromatic aberration shader - RGB channel splitting
 */
export interface ChromaticAberrationShader extends ShaderLayerBase {
  type: "chromatic-aberration";
  properties: {
    /** Offset intensity (0-0.1) */
    offset: number;
  };
}

/**
 * LUT color grading shader - applies color lookup table
 */
export interface LutShader extends ShaderLayerBase {
  type: "lut";
  properties: {
    /** Data URL or URL of the LUT image (256x16) */
    lutUrl: string;
    /** Blend intensity between original and graded (0-1) */
    intensity: number;
  };
}

/**
 * Halation shader - film-like glow on bright areas
 */
export interface HalationShader extends ShaderLayerBase {
  type: "halation";
  properties: {
    /** Brightness threshold for halation (0-1) */
    threshold: number;
    /** Effect intensity (0-1) */
    intensity: number;
    /** Blur spread radius (1-20) */
    spread: number;
    /** Halation tint color RGB (0-1 each) */
    tint: [number, number, number];
  };
}

/**
 * Bloom shader - soft glow effect with HDR tone mapping
 */
export interface BloomShader extends ShaderLayerBase {
  type: "bloom";
  properties: {
    /** Brightness threshold for bloom (0-1) */
    threshold: number;
    /** Bloom intensity (0-2) */
    intensity: number;
    /** Blur radius (1-20) */
    radius: number;
    /** Exposure for tone mapping (0.5-3) */
    exposure: number;
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
  | DuotoneShader
  | PixelateShader
  | ThresholdShader
  | DitherShader
  | VignetteShader
  | ChromaticAberrationShader
  | LutShader
  | HalationShader
  | BloomShader;

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
  "pixelate": {
    size: 8,
  },
  "threshold": {
    value: 0.5,
  },
  "dither": {
    scale: 1,
  },
  "vignette": {
    size: 0.25,
    roundness: 0.5,
    smoothness: 0.5,
  },
  "chromatic-aberration": {
    offset: 0.02,
  },
  "lut": {
    lutUrl: "",
    intensity: 1.0,
  },
  "halation": {
    threshold: 0.7,
    intensity: 0.3,
    spread: 8,
    tint: [1.0, 0.3, 0.1],
  },
  "bloom": {
    threshold: 0.6,
    intensity: 0.5,
    radius: 10,
    exposure: 1.0,
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
  "pixelate": "Pixelate",
  "threshold": "Threshold",
  "dither": "Dither",
  "vignette": "Vignette",
  "chromatic-aberration": "Chromatic Aberration",
  "lut": "LUT Color Grade",
  "halation": "Halation",
  "bloom": "Bloom",
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
