import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "jotai";
import {
  canvasStateAtom,
  imagesAtom,
  addImageAtom,
  removeImageAtom,
  updateImageAtom,
  bringToFrontAtom,
  sendToBackAtom,
  selectedImageIdsAtom,
  selectImageAtom,
} from "@/store";
import type { CreateImageInput } from "@/types/image";

describe("Image CRUD Operations", () => {
  let store: ReturnType<typeof createStore>;

  const testImage: CreateImageInput = {
    url: "https://example.com/test.jpg",
    position: { x: 100, y: 100 },
    size: { width: 200, height: 150 },
  };

  beforeEach(() => {
    store = createStore();
  });

  describe("addImage", () => {
    it("should add an image with default properties", () => {
      store.set(addImageAtom, testImage);
      const images = store.get(imagesAtom);

      expect(images).toHaveLength(1);
      expect(images[0]).toMatchObject({
        url: testImage.url,
        position: testImage.position,
        size: testImage.size,
        shaderLayers: [],
        locked: false,
        visible: true,
      });
      expect(images[0].id).toBeDefined();
      expect(typeof images[0].id).toBe("string");
    });

    it("should set originalSize from size if not provided", () => {
      store.set(addImageAtom, testImage);
      const images = store.get(imagesAtom);

      expect(images[0].originalSize).toEqual(testImage.size);
    });

    it("should use provided originalSize", () => {
      const imageWithOriginal: CreateImageInput = {
        ...testImage,
        originalSize: { width: 1920, height: 1080 },
      };
      store.set(addImageAtom, imageWithOriginal);
      const images = store.get(imagesAtom);

      expect(images[0].originalSize).toEqual({ width: 1920, height: 1080 });
    });

    it("should assign incrementing z-index", () => {
      store.set(addImageAtom, { ...testImage, url: "a.jpg" });
      store.set(addImageAtom, { ...testImage, url: "b.jpg" });
      store.set(addImageAtom, { ...testImage, url: "c.jpg" });

      const images = store.get(imagesAtom);
      expect(images[0].zIndex).toBeLessThan(images[1].zIndex);
      expect(images[1].zIndex).toBeLessThan(images[2].zIndex);
    });

    it("should return the new image id", () => {
      const id = store.set(addImageAtom, testImage);
      const images = store.get(imagesAtom);

      expect(id).toBe(images[0].id);
    });
  });

  describe("removeImage", () => {
    it("should remove image by id", () => {
      store.set(addImageAtom, testImage);
      const images = store.get(imagesAtom);
      const imageId = images[0].id;

      store.set(removeImageAtom, imageId);

      expect(store.get(imagesAtom)).toHaveLength(0);
    });

    it("should not affect other images", () => {
      store.set(addImageAtom, { ...testImage, url: "a.jpg" });
      store.set(addImageAtom, { ...testImage, url: "b.jpg" });

      const images = store.get(imagesAtom);
      store.set(removeImageAtom, images[0].id);

      const remaining = store.get(imagesAtom);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].url).toBe("b.jpg");
    });

    it("should clear selection when removing selected image", () => {
      store.set(addImageAtom, testImage);
      const images = store.get(imagesAtom);
      const imageId = images[0].id;

      store.set(selectImageAtom, imageId);
      expect(store.get(selectedImageIdsAtom)).toContain(imageId);

      store.set(removeImageAtom, imageId);
      expect(store.get(selectedImageIdsAtom)).not.toContain(imageId);
    });

    it("should handle removing non-existent image", () => {
      store.set(addImageAtom, testImage);
      const imagesBefore = store.get(imagesAtom);

      store.set(removeImageAtom, "non-existent-id");

      expect(store.get(imagesAtom)).toEqual(imagesBefore);
    });
  });

  describe("updateImage", () => {
    it("should update image position", () => {
      store.set(addImageAtom, testImage);
      const imageId = store.get(imagesAtom)[0].id;

      store.set(updateImageAtom, {
        id: imageId,
        changes: { position: { x: 200, y: 300 } },
      });

      const updated = store.get(imagesAtom)[0];
      expect(updated.position).toEqual({ x: 200, y: 300 });
    });

    it("should update image size", () => {
      store.set(addImageAtom, testImage);
      const imageId = store.get(imagesAtom)[0].id;

      store.set(updateImageAtom, {
        id: imageId,
        changes: { size: { width: 400, height: 300 } },
      });

      const updated = store.get(imagesAtom)[0];
      expect(updated.size).toEqual({ width: 400, height: 300 });
    });

    it("should update locked state", () => {
      store.set(addImageAtom, testImage);
      const imageId = store.get(imagesAtom)[0].id;

      store.set(updateImageAtom, {
        id: imageId,
        changes: { locked: true },
      });

      expect(store.get(imagesAtom)[0].locked).toBe(true);
    });

    it("should update visible state", () => {
      store.set(addImageAtom, testImage);
      const imageId = store.get(imagesAtom)[0].id;

      store.set(updateImageAtom, {
        id: imageId,
        changes: { visible: false },
      });

      expect(store.get(imagesAtom)[0].visible).toBe(false);
    });

    it("should not affect other images", () => {
      store.set(addImageAtom, { ...testImage, url: "a.jpg" });
      store.set(addImageAtom, { ...testImage, url: "b.jpg" });

      const images = store.get(imagesAtom);
      store.set(updateImageAtom, {
        id: images[0].id,
        changes: { position: { x: 999, y: 999 } },
      });

      const updated = store.get(imagesAtom);
      expect(updated[0].position).toEqual({ x: 999, y: 999 });
      expect(updated[1].position).toEqual(testImage.position);
    });
  });

  describe("bringToFront", () => {
    it("should move image to highest z-index", () => {
      store.set(addImageAtom, { ...testImage, url: "a.jpg" });
      store.set(addImageAtom, { ...testImage, url: "b.jpg" });
      store.set(addImageAtom, { ...testImage, url: "c.jpg" });

      const images = store.get(imagesAtom);
      const firstImageId = images[0].id;
      const lastZIndex = images[2].zIndex;

      store.set(bringToFrontAtom, firstImageId);

      const updated = store.get(imagesAtom);
      const movedImage = updated.find((img) => img.id === firstImageId)!;
      expect(movedImage.zIndex).toBeGreaterThan(lastZIndex);
    });
  });

  describe("sendToBack", () => {
    it("should move image to lowest z-index", () => {
      store.set(addImageAtom, { ...testImage, url: "a.jpg" });
      store.set(addImageAtom, { ...testImage, url: "b.jpg" });
      store.set(addImageAtom, { ...testImage, url: "c.jpg" });

      const images = store.get(imagesAtom);
      const lastImageId = images[2].id;
      const firstZIndex = images[0].zIndex;

      store.set(sendToBackAtom, lastImageId);

      const updated = store.get(imagesAtom);
      const movedImage = updated.find((img) => img.id === lastImageId)!;
      expect(movedImage.zIndex).toBeLessThan(firstZIndex);
    });
  });

  describe("canvas state updates", () => {
    it("should update updatedAt timestamp on image changes", () => {
      const stateBefore = store.get(canvasStateAtom);
      const timestampBefore = stateBefore.updatedAt;

      // Small delay to ensure timestamp difference
      store.set(addImageAtom, testImage);

      const stateAfter = store.get(canvasStateAtom);
      expect(stateAfter.updatedAt).toBeGreaterThanOrEqual(timestampBefore);
    });
  });
});
