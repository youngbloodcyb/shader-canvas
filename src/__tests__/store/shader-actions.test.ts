import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "jotai";
import {
  imagesAtom,
  addImageAtom,
  addShaderLayerAtom,
  removeShaderLayerAtom,
  updateShaderLayerAtom,
  toggleShaderLayerAtom,
  reorderShaderLayerAtom,
  clearShaderLayersAtom,
  duplicateShaderLayerAtom,
} from "@/store";
import type { CreateImageInput } from "@/types/image";
import { SHADER_DEFAULTS } from "@/types/shader";

describe("Shader Layer CRUD Operations", () => {
  let store: ReturnType<typeof createStore>;
  let imageId: string;

  const testImage: CreateImageInput = {
    url: "https://example.com/test.jpg",
    position: { x: 100, y: 100 },
    size: { width: 200, height: 150 },
  };

  beforeEach(() => {
    store = createStore();
    imageId = store.set(addImageAtom, testImage) as string;
  });

  describe("addShaderLayer", () => {
    it("should add brightness shader with default properties", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "brightness" });

      const image = store.get(imagesAtom)[0];
      expect(image.shaderLayers).toHaveLength(1);
      expect(image.shaderLayers[0]).toMatchObject({
        type: "brightness",
        enabled: true,
        order: 0,
        properties: SHADER_DEFAULTS.brightness,
      });
    });

    it("should add contrast shader with default properties", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });

      const layer = store.get(imagesAtom)[0].shaderLayers[0];
      expect(layer.type).toBe("contrast");
      expect(layer.properties).toEqual(SHADER_DEFAULTS.contrast);
    });

    it("should add blur shader with default properties", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "blur" });

      const layer = store.get(imagesAtom)[0].shaderLayers[0];
      expect(layer.type).toBe("blur");
      expect(layer.properties).toEqual(SHADER_DEFAULTS.blur);
    });

    it("should add saturation shader with default properties", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "saturation" });

      const layer = store.get(imagesAtom)[0].shaderLayers[0];
      expect(layer.type).toBe("saturation");
      expect(layer.properties).toEqual(SHADER_DEFAULTS.saturation);
    });

    it("should add hue-rotate shader with default properties", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "hue-rotate" });

      const layer = store.get(imagesAtom)[0].shaderLayers[0];
      expect(layer.type).toBe("hue-rotate");
      expect(layer.properties).toEqual(SHADER_DEFAULTS["hue-rotate"]);
    });

    it("should add invert shader with default properties", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "invert" });

      const layer = store.get(imagesAtom)[0].shaderLayers[0];
      expect(layer.type).toBe("invert");
      expect(layer.properties).toEqual(SHADER_DEFAULTS.invert);
    });

    it("should assign incrementing order values", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "brightness" });
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });
      store.set(addShaderLayerAtom, { imageId, shaderType: "blur" });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers[0].order).toBe(0);
      expect(layers[1].order).toBe(1);
      expect(layers[2].order).toBe(2);
    });

    it("should return the new layer id", () => {
      const layerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      const layer = store.get(imagesAtom)[0].shaderLayers[0];
      expect(layerId).toBe(layer.id);
    });

    it("should return null for non-existent image", () => {
      const result = store.set(addShaderLayerAtom, {
        imageId: "non-existent",
        shaderType: "brightness",
      });

      expect(result).toBeNull();
    });
  });

  describe("removeShaderLayer", () => {
    it("should remove shader layer by id", () => {
      const layerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      store.set(removeShaderLayerAtom, { imageId, layerId: layerId! });

      expect(store.get(imagesAtom)[0].shaderLayers).toHaveLength(0);
    });

    it("should update order values after removal", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "brightness" });
      const layerToRemove = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "contrast",
      });
      store.set(addShaderLayerAtom, { imageId, shaderType: "blur" });

      store.set(removeShaderLayerAtom, { imageId, layerId: layerToRemove! });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers).toHaveLength(2);
      expect(layers[0].order).toBe(0);
      expect(layers[1].order).toBe(1);
    });

    it("should not affect other layers", () => {
      const layer1 = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });

      store.set(removeShaderLayerAtom, { imageId, layerId: layer1! });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers).toHaveLength(1);
      expect(layers[0].type).toBe("contrast");
    });
  });

  describe("updateShaderLayer", () => {
    it("should update shader enabled state", () => {
      const layerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      store.set(updateShaderLayerAtom, {
        imageId,
        layerId: layerId!,
        changes: { enabled: false },
      });

      expect(store.get(imagesAtom)[0].shaderLayers[0].enabled).toBe(false);
    });

    it("should update shader properties", () => {
      const layerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      store.set(updateShaderLayerAtom, {
        imageId,
        layerId: layerId!,
        changes: { properties: { value: 0.5 } },
      });

      const layer = store.get(imagesAtom)[0].shaderLayers[0];
      expect(layer.properties).toEqual({ value: 0.5 });
    });

    it("should not affect other layers", () => {
      const layer1 = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });

      store.set(updateShaderLayerAtom, {
        imageId,
        layerId: layer1!,
        changes: { enabled: false },
      });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers[0].enabled).toBe(false);
      expect(layers[1].enabled).toBe(true);
    });
  });

  describe("toggleShaderLayer", () => {
    it("should toggle enabled state from true to false", () => {
      const layerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      store.set(toggleShaderLayerAtom, { imageId, layerId: layerId! });

      expect(store.get(imagesAtom)[0].shaderLayers[0].enabled).toBe(false);
    });

    it("should toggle enabled state from false to true", () => {
      const layerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      store.set(toggleShaderLayerAtom, { imageId, layerId: layerId! });
      store.set(toggleShaderLayerAtom, { imageId, layerId: layerId! });

      expect(store.get(imagesAtom)[0].shaderLayers[0].enabled).toBe(true);
    });
  });

  describe("reorderShaderLayer", () => {
    it("should move layer to new position", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "brightness" });
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });
      const blurLayerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "blur",
      });

      store.set(reorderShaderLayerAtom, {
        imageId,
        layerId: blurLayerId!,
        newOrder: 0,
      });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers[0].type).toBe("blur");
      expect(layers[1].type).toBe("brightness");
      expect(layers[2].type).toBe("contrast");
    });

    it("should update all order values after reorder", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "brightness" });
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });
      const blurLayerId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "blur",
      });

      store.set(reorderShaderLayerAtom, {
        imageId,
        layerId: blurLayerId!,
        newOrder: 0,
      });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers[0].order).toBe(0);
      expect(layers[1].order).toBe(1);
      expect(layers[2].order).toBe(2);
    });

    it("should handle moving to end of list", () => {
      const brightnessId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });
      store.set(addShaderLayerAtom, { imageId, shaderType: "blur" });

      store.set(reorderShaderLayerAtom, {
        imageId,
        layerId: brightnessId!,
        newOrder: 2,
      });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers[2].type).toBe("brightness");
    });
  });

  describe("clearShaderLayers", () => {
    it("should remove all shader layers from image", () => {
      store.set(addShaderLayerAtom, { imageId, shaderType: "brightness" });
      store.set(addShaderLayerAtom, { imageId, shaderType: "contrast" });
      store.set(addShaderLayerAtom, { imageId, shaderType: "blur" });

      store.set(clearShaderLayersAtom, imageId);

      expect(store.get(imagesAtom)[0].shaderLayers).toHaveLength(0);
    });
  });

  describe("duplicateShaderLayer", () => {
    it("should create a copy of the shader layer", () => {
      const originalId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      // Modify the original
      store.set(updateShaderLayerAtom, {
        imageId,
        layerId: originalId!,
        changes: { properties: { value: 0.7 } },
      });

      const duplicateId = store.set(duplicateShaderLayerAtom, {
        imageId,
        layerId: originalId!,
      });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers).toHaveLength(2);
      expect(duplicateId).not.toBe(originalId);
      expect(layers[1].type).toBe("brightness");
      expect(layers[1].properties).toEqual({ value: 0.7 });
    });

    it("should assign new order value to duplicate", () => {
      const originalId = store.set(addShaderLayerAtom, {
        imageId,
        shaderType: "brightness",
      });

      store.set(duplicateShaderLayerAtom, { imageId, layerId: originalId! });

      const layers = store.get(imagesAtom)[0].shaderLayers;
      expect(layers[1].order).toBe(1);
    });

    it("should return null for non-existent layer", () => {
      const result = store.set(duplicateShaderLayerAtom, {
        imageId,
        layerId: "non-existent",
      });

      expect(result).toBeNull();
    });
  });
});
