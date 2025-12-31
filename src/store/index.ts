// Canvas atoms
export {
  canvasStateAtom,
  transformAtom,
  gridVisibleAtom,
  canvasNameAtom,
  resetCanvasAtom,
  generateId,
} from "./atoms/canvas-atom";

// Image atoms
export {
  imagesAtom,
  addImageAtom,
  removeImageAtom,
  updateImageAtom,
  bringToFrontAtom,
  sendToBackAtom,
  imageByIdAtom,
  sortedImagesAtom,
} from "./atoms/images-atom";

// Selection atoms
export {
  selectedImageIdsAtom,
  selectedImagesAtom,
  selectedImageAtom,
  isSelectedAtom,
  selectImageAtom,
  toggleSelectionAtom,
  addToSelectionAtom,
  clearSelectionAtom,
  selectAllAtom,
  deleteSelectedAtom,
} from "./atoms/selection-atom";

// Shader actions
export {
  addShaderLayerAtom,
  removeShaderLayerAtom,
  updateShaderLayerAtom,
  toggleShaderLayerAtom,
  reorderShaderLayerAtom,
  clearShaderLayersAtom,
  duplicateShaderLayerAtom,
} from "./actions/shader-actions";

// Re-export types
export type { CanvasState } from "@/types/state";
export type { CanvasImage } from "@/types/image";
export type { ShaderLayer, ShaderType } from "@/types/shader";
