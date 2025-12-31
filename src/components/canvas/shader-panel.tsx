import { useAtomValue, useSetAtom } from "jotai";
import {
  selectedImageAtom,
  addShaderLayerAtom,
  removeShaderLayerAtom,
  updateShaderLayerAtom,
  toggleShaderLayerAtom,
} from "@/store";
import { SHADER_LABELS, type ShaderType, type ShaderLayer } from "@/types/shader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

/**
 * Slider component for shader property
 */
function PropertySlider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

/**
 * Individual shader layer editor
 */
function ShaderLayerEditor({
  layer,
  imageId,
}: {
  layer: ShaderLayer;
  imageId: string;
}) {
  const updateLayer = useSetAtom(updateShaderLayerAtom);
  const toggleLayer = useSetAtom(toggleShaderLayerAtom);
  const removeLayer = useSetAtom(removeShaderLayerAtom);

  const updateProperty = (key: string, value: number) => {
    updateLayer({
      imageId,
      layerId: layer.id,
      changes: {
        properties: { ...layer.properties, [key]: value },
      },
    });
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border bg-card",
        !layer.enabled && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{SHADER_LABELS[layer.type]}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => toggleLayer({ imageId, layerId: layer.id })}
          >
            {layer.enabled ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeLayer({ imageId, layerId: layer.id })}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {layer.type === "brightness" && (
          <PropertySlider
            label="Brightness"
            value={layer.properties.value}
            min={-1}
            max={1}
            onChange={(v) => updateProperty("value", v)}
          />
        )}

        {layer.type === "contrast" && (
          <PropertySlider
            label="Contrast"
            value={layer.properties.value}
            min={-1}
            max={1}
            onChange={(v) => updateProperty("value", v)}
          />
        )}

        {layer.type === "exposure" && (
          <PropertySlider
            label="Exposure"
            value={layer.properties.value}
            min={0.5}
            max={2}
            onChange={(v) => updateProperty("value", v)}
          />
        )}

        {layer.type === "saturation" && (
          <PropertySlider
            label="Saturation"
            value={layer.properties.value}
            min={0}
            max={2}
            onChange={(v) => updateProperty("value", v)}
          />
        )}

        {layer.type === "invert" && (
          <PropertySlider
            label="Amount"
            value={layer.properties.amount}
            min={0}
            max={1}
            onChange={(v) => updateProperty("amount", v)}
          />
        )}

        {layer.type === "color-correction" && (
          <>
            <PropertySlider
              label="Brightness"
              value={layer.properties.brightness}
              min={-1}
              max={1}
              onChange={(v) => updateProperty("brightness", v)}
            />
            <PropertySlider
              label="Contrast"
              value={layer.properties.contrast}
              min={-1}
              max={1}
              onChange={(v) => updateProperty("contrast", v)}
            />
            <PropertySlider
              label="Exposure"
              value={layer.properties.exposure}
              min={0.5}
              max={2}
              onChange={(v) => updateProperty("exposure", v)}
            />
            <PropertySlider
              label="Saturation"
              value={layer.properties.saturation}
              min={0}
              max={2}
              onChange={(v) => updateProperty("saturation", v)}
            />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Shader types available to add
 */
const AVAILABLE_SHADERS: ShaderType[] = [
  "color-correction",
  "brightness",
  "contrast",
  "exposure",
  "saturation",
  "invert",
];

/**
 * Main shader panel component
 */
export function ShaderPanel() {
  const selectedImage = useAtomValue(selectedImageAtom);
  const addShaderLayer = useSetAtom(addShaderLayerAtom);

  if (!selectedImage) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select an image to edit shaders
      </div>
    );
  }

  const sortedLayers = [...selectedImage.shaderLayers].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Label className="text-xs font-medium uppercase text-muted-foreground">
          Shader Layers
        </Label>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sortedLayers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No shader layers yet
          </p>
        ) : (
          sortedLayers.map((layer) => (
            <ShaderLayerEditor
              key={layer.id}
              layer={layer}
              imageId={selectedImage.id}
            />
          ))
        )}
      </div>

      <Separator />

      <div className="p-3">
        <Label className="text-xs font-medium uppercase text-muted-foreground mb-2 block">
          Add Shader
        </Label>
        <div className="flex flex-wrap gap-1">
          {AVAILABLE_SHADERS.map((type) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => addShaderLayer({ imageId: selectedImage.id, shaderType: type })}
            >
              <Plus className="h-3 w-3 mr-1" />
              {SHADER_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
