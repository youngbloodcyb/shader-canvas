import { atom } from "jotai";
import { imagesAtom } from "../atoms/images-atom";
import { generateId } from "../atoms/canvas-atom";
import type { ShaderType, ShaderLayer } from "@/types/shader";
import { createShaderLayer } from "@/types/shader";
import type { CanvasImage } from "@/types/image";

/**
 * Add a shader layer to an image
 */
export const addShaderLayerAtom = atom(
  null,
  (
    get,
    set,
    payload: { imageId: string; shaderType: ShaderType }
  ): string | null => {
    const images = get(imagesAtom);
    const image = images.find((img) => img.id === payload.imageId);

    if (!image) return null;

    const newLayer = createShaderLayer(
      payload.shaderType,
      generateId(),
      image.shaderLayers.length
    );

    set(
      imagesAtom,
      images.map((img) =>
        img.id === payload.imageId
          ? { ...img, shaderLayers: [...img.shaderLayers, newLayer] }
          : img
      )
    );

    return newLayer.id;
  }
);

/**
 * Remove a shader layer from an image
 */
export const removeShaderLayerAtom = atom(
  null,
  (get, set, payload: { imageId: string; layerId: string }) => {
    const images = get(imagesAtom);
    const updated: CanvasImage[] = images.map((img) => {
      if (img.id !== payload.imageId) return img;
      return {
        ...img,
        shaderLayers: img.shaderLayers
          .filter((layer) => layer.id !== payload.layerId)
          .map((layer, index) => ({ ...layer, order: index })),
      };
    });
    set(imagesAtom, updated);
  }
);

/**
 * Update a shader layer's properties
 */
export const updateShaderLayerAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      imageId: string;
      layerId: string;
      changes: Partial<Pick<ShaderLayer, "enabled" | "order" | "properties">>;
    }
  ) => {
    const images = get(imagesAtom);
    const updated: CanvasImage[] = images.map((img) => {
      if (img.id !== payload.imageId) return img;
      return {
        ...img,
        shaderLayers: img.shaderLayers.map((layer) => {
          if (layer.id !== payload.layerId) return layer;
          // Type-safe merge of changes
          const merged = { ...layer };
          if (payload.changes.enabled !== undefined) {
            merged.enabled = payload.changes.enabled;
          }
          if (payload.changes.order !== undefined) {
            merged.order = payload.changes.order;
          }
          if (payload.changes.properties !== undefined) {
            merged.properties = payload.changes.properties as typeof layer.properties;
          }
          return merged;
        }),
      };
    });
    set(imagesAtom, updated);
  }
);

/**
 * Toggle a shader layer's enabled state
 */
export const toggleShaderLayerAtom = atom(
  null,
  (get, set, payload: { imageId: string; layerId: string }) => {
    const images = get(imagesAtom);
    const updated: CanvasImage[] = images.map((img) => {
      if (img.id !== payload.imageId) return img;
      return {
        ...img,
        shaderLayers: img.shaderLayers.map((layer) =>
          layer.id === payload.layerId
            ? { ...layer, enabled: !layer.enabled }
            : layer
        ),
      };
    });
    set(imagesAtom, updated);
  }
);

/**
 * Reorder a shader layer
 */
export const reorderShaderLayerAtom = atom(
  null,
  (
    get,
    set,
    payload: { imageId: string; layerId: string; newOrder: number }
  ) => {
    const images = get(imagesAtom);
    const image = images.find((img) => img.id === payload.imageId);

    if (!image) return;

    const layers = [...image.shaderLayers];
    const currentIndex = layers.findIndex((l) => l.id === payload.layerId);

    if (currentIndex === -1) return;

    // Remove from current position
    const [layer] = layers.splice(currentIndex, 1);

    // Insert at new position
    const newIndex = Math.max(0, Math.min(payload.newOrder, layers.length));
    layers.splice(newIndex, 0, layer);

    // Update order values
    const reorderedLayers = layers.map((l, index) => ({
      ...l,
      order: index,
    }));

    const updated: CanvasImage[] = images.map((img) =>
      img.id === payload.imageId
        ? { ...img, shaderLayers: reorderedLayers }
        : img
    );
    set(imagesAtom, updated);
  }
);

/**
 * Clear all shader layers from an image
 */
export const clearShaderLayersAtom = atom(
  null,
  (get, set, imageId: string) => {
    const images = get(imagesAtom);
    const updated: CanvasImage[] = images.map((img) =>
      img.id === imageId ? { ...img, shaderLayers: [] } : img
    );
    set(imagesAtom, updated);
  }
);

/**
 * Duplicate a shader layer
 */
export const duplicateShaderLayerAtom = atom(
  null,
  (get, set, payload: { imageId: string; layerId: string }): string | null => {
    const images = get(imagesAtom);
    const image = images.find((img) => img.id === payload.imageId);

    if (!image) return null;

    const layer = image.shaderLayers.find((l) => l.id === payload.layerId);
    if (!layer) return null;

    const newLayer: ShaderLayer = {
      ...layer,
      id: generateId(),
      order: image.shaderLayers.length,
    };

    const updated: CanvasImage[] = images.map((img) =>
      img.id === payload.imageId
        ? { ...img, shaderLayers: [...img.shaderLayers, newLayer] }
        : img
    );
    set(imagesAtom, updated);

    return newLayer.id;
  }
);
