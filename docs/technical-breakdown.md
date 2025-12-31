# Technical Breakdown: Shader Canvas Architecture

This document provides a detailed technical explanation of how the infinite canvas, WebGL shader system, and Jotai state management work together.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [State Management with Jotai](#state-management-with-jotai)
3. [Canvas Rendering Pipeline](#canvas-rendering-pipeline)
4. [WebGL Shader System](#webgl-shader-system)
5. [Data Flow](#data-flow)

---

## Architecture Overview

The application uses a dual-canvas rendering approach:

```
┌─────────────────────────────────────────────────────────────┐
│                     InfiniteCanvas                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Canvas 2D (Main Display)                 │  │
│  │  - Grid rendering                                     │  │
│  │  - Image rendering (with shader processing)           │  │
│  │  - Selection UI (borders, resize handles)             │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ▲                                │
│                            │ draws processed images         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           WebGL (Offscreen Processing)                │  │
│  │  - Shader layer composition                           │  │
│  │  - Multi-pass ping-pong rendering                     │  │
│  │  - Returns processed canvas for 2D drawing            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Canvas 2D for display**: Smooth 60fps interaction for pan/zoom/selection
2. **WebGL for processing**: GPU-accelerated shader effects on images
3. **Offscreen rendering**: Shaders run on a hidden canvas, results copied to main canvas
4. **Jotai for state**: Atomic state management with derived atoms for computed values

---

## State Management with Jotai

### Core Atoms

Located in `src/store/atoms/`:

#### Canvas State (`canvas-atom.ts`)

```typescript
// Main state atom - single source of truth
export const canvasStateAtom = atom<CanvasState>({
  id: "default",
  name: "Untitled Canvas",
  transform: { offsetX: 0, offsetY: 0, scale: 1 },
  images: [],
  selectedImageIds: [],
  gridVisible: true,
});

// Derived atoms for specific pieces of state
export const transformAtom = atom(
  (get) => get(canvasStateAtom).transform,
  (get, set, transform: CanvasTransform) => {
    set(canvasStateAtom, { ...get(canvasStateAtom), transform });
  }
);
```

#### Image Management (`images-atom.ts`)

```typescript
// Derived atom for sorted images (by zIndex)
export const sortedImagesAtom = atom((get) => {
  const state = get(canvasStateAtom);
  return [...state.images].sort((a, b) => a.zIndex - b.zIndex);
});

// Write atom for adding images
export const addImageAtom = atom(null, (get, set, params: AddImageParams) => {
  const state = get(canvasStateAtom);
  const newImage: CanvasImage = {
    id: crypto.randomUUID(),
    url: params.url,
    position: params.position,
    size: params.size,
    originalSize: params.originalSize,
    shaderLayers: [],
    zIndex: state.images.length,
    locked: false,
    visible: true,
  };
  set(canvasStateAtom, {
    ...state,
    images: [...state.images, newImage],
    selectedImageIds: [newImage.id],
  });
});
```

#### Selection State (`selection-atom.ts`)

```typescript
// Currently selected image (first selected, for shader editing)
export const selectedImageAtom = atom((get) => {
  const state = get(canvasStateAtom);
  const selectedId = state.selectedImageIds[0];
  return state.images.find((img) => img.id === selectedId) ?? null;
});
```

### Shader Actions (`shader-actions.ts`)

Shader layers are stored per-image and manipulated through write atoms:

```typescript
export const addShaderLayerAtom = atom(
  null,
  (get, set, { imageId, shaderType }: { imageId: string; shaderType: ShaderType }) => {
    const state = get(canvasStateAtom);
    const image = state.images.find((img) => img.id === imageId);
    if (!image) return;

    const newLayer = createShaderLayer(
      shaderType,
      crypto.randomUUID(),
      image.shaderLayers.length
    );

    const updatedImages = state.images.map((img) =>
      img.id === imageId
        ? { ...img, shaderLayers: [...img.shaderLayers, newLayer] }
        : img
    );

    set(canvasStateAtom, { ...state, images: updatedImages });
  }
);
```

### Type-Safe Shader System

The shader system uses TypeScript discriminated unions for type safety:

```typescript
// Base interface
interface ShaderLayerBase {
  id: string;
  enabled: boolean;
  order: number;
}

// Each shader type has specific properties
interface BrightnessShader extends ShaderLayerBase {
  type: "brightness";
  properties: { value: number };
}

interface VignetteShader extends ShaderLayerBase {
  type: "vignette";
  properties: {
    size: number;
    roundness: number;
    smoothness: number;
  };
}

// Union type enables exhaustive type checking
type ShaderLayer = BrightnessShader | ContrastShader | VignetteShader | ...;
```

---

## Canvas Rendering Pipeline

### Main Rendering Hook (`use-canvas-renderer.ts`)

The rendering loop runs at 60fps using `requestAnimationFrame`:

```typescript
export function useCanvasRenderer(canvasRef: RefObject<HTMLCanvasElement>) {
  const transform = useAtomValue(transformAtom);
  const images = useAtomValue(sortedImagesAtom);
  const selectedIds = useAtomValue(selectedImageIdsAtom);

  const { getProcessedImage } = useShaderRenderer();

  // Main render function
  const render = useCallback(() => {
    const ctx = canvas.getContext("2d");

    // Handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear and draw layers
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawGrid(ctx, transform);
    drawImages(ctx, images, transform);
    drawSelection(ctx, images, selectedIds, transform);
  }, [transform, images, selectedIds]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      frameIdRef.current = requestAnimationFrame(animate);
    };
    frameIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [render]);
}
```

### Image Drawing with Shader Processing

When drawing images, the renderer checks for shader layers:

```typescript
const drawImages = useCallback((ctx, images, transform) => {
  for (const image of images) {
    if (!image.visible) continue;

    const cachedImg = imageCacheRef.current.get(image.url);
    if (!cachedImg) continue;

    // Transform world coordinates to screen coordinates
    const screenX = image.position.x * transform.scale + transform.offsetX;
    const screenY = image.position.y * transform.scale + transform.offsetY;
    const screenWidth = image.size.width * transform.scale;
    const screenHeight = image.size.height * transform.scale;

    // Get processed image if there are shader layers
    let imageToDraw = cachedImg;
    if (image.shaderLayers.length > 0) {
      imageToDraw = getProcessedImage(
        cachedImg,
        image.shaderLayers,
        Math.ceil(screenWidth),
        Math.ceil(screenHeight)
      );
    }

    ctx.drawImage(imageToDraw, screenX, screenY, screenWidth, screenHeight);
  }
}, [getProcessedImage]);
```

### Coordinate Systems

The canvas uses two coordinate systems:

```
World Coordinates (infinite canvas space)
├── Independent of zoom/pan
├── Images store position in world coords
└── Used for hit testing and logic

Screen Coordinates (visible viewport)
├── Pixels on the actual canvas element
├── Affected by transform (offsetX, offsetY, scale)
└── Used for rendering

Conversion:
  screenX = worldX * scale + offsetX
  screenY = worldY * scale + offsetY

  worldX = (screenX - offsetX) / scale
  worldY = (screenY - offsetY) / scale
```

---

## WebGL Shader System

### Shader Renderer Hook (`use-shader-renderer.ts`)

Creates an offscreen WebGL context for shader processing:

```typescript
export function useShaderRenderer() {
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext>(null);
  const compositorRef = useRef<ShaderCompositor>(null);
  const processedCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    // Create offscreen canvas
    const canvas = document.createElement("canvas");
    const gl = createWebGLContext(canvas);

    glRef.current = gl;
    compositorRef.current = new ShaderCompositor(gl);

    return () => compositorRef.current?.dispose();
  }, []);

  const getProcessedImage = useCallback((image, layers, width, height) => {
    // Check cache first
    const cacheKey = getCacheKey(image.src, layers);
    const cached = processedCacheRef.current.get(cacheKey);
    if (cached) return cached;

    // Process through WebGL
    const processed = processImage(image, layers, width, height);
    processedCacheRef.current.set(cacheKey, processed);
    return processed;
  }, []);
}
```

### Shader Compositor (`compositor.ts`)

The compositor handles multi-pass rendering using ping-pong buffers:

```typescript
export class ShaderCompositor {
  private gl: WebGL2RenderingContext;
  private programManager: ShaderProgramManager;
  private textureCache: TextureCache;
  private pingPong: PingPongBuffer;
  private quadRenderer: QuadRenderer;

  render(image: HTMLImageElement, layers: ShaderLayer[]): void {
    const activeLayers = layers.filter(hasEffect).sort((a, b) => a.order - b.order);

    // Get texture for source image
    const imageTexture = this.textureCache.getTexture(image.src, image);
    let inputTexture = imageTexture;

    // Apply each shader layer in sequence
    for (let i = 0; i < activeLayers.length; i++) {
      const layer = activeLayers[i];
      const isLastPass = i === activeLayers.length - 1;

      // Get compiled shader program
      const fragmentShader = getFragmentShader(layer.type);
      const program = this.programManager.getProgram(
        layer.type,
        quadVertexShader,
        fragmentShader
      );

      gl.useProgram(program);
      this.quadRenderer.setupForProgram(program);

      // Bind output (framebuffer or screen)
      if (isLastPass) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.pingPong.getWriteFramebuffer());
      }

      // Bind input texture and set uniforms
      bindTexture(gl, inputTexture, 0);
      setShaderUniforms(gl, program, layer);

      // Important: Only flip Y on first pass (image texture)
      // Framebuffer textures are already in correct orientation
      gl.uniform1i(flipYLoc, i === 0 ? 1 : 0);

      // Draw fullscreen quad
      this.quadRenderer.draw();

      // Swap buffers for next pass
      if (!isLastPass) {
        this.pingPong.swap();
        inputTexture = this.pingPong.getReadTexture();
      }
    }
  }
}
```

### Ping-Pong Rendering

Multi-pass effects require reading from one framebuffer while writing to another:

```
Pass 1: Image Texture → Framebuffer A (brightness)
Pass 2: Framebuffer A → Framebuffer B (contrast)
Pass 3: Framebuffer B → Framebuffer A (vignette)
Pass 4: Framebuffer A → Screen (chromatic aberration)

The ping-pong pattern alternates between two framebuffers,
allowing each pass to read the previous result.
```

```typescript
export class PingPongBuffer {
  private framebuffers: [Framebuffer, Framebuffer];
  private currentIndex = 0;

  getReadTexture(): WebGLTexture {
    return this.framebuffers[this.currentIndex].texture;
  }

  getWriteFramebuffer(): WebGLFramebuffer {
    const writeIndex = (this.currentIndex + 1) % 2;
    return this.framebuffers[writeIndex].framebuffer;
  }

  swap(): void {
    this.currentIndex = (this.currentIndex + 1) % 2;
  }
}
```

### Vertex Shader (Fullscreen Quad)

All shader effects use the same vertex shader that renders a fullscreen quad:

```glsl
#version 300 es

in vec2 a_position;
uniform bool u_flipY;
out vec2 v_texCoord;

void main() {
  // Convert clip space (-1 to 1) to texture coordinates (0 to 1)
  v_texCoord = (a_position + 1.0) * 0.5;

  // Flip Y only for image textures (first pass)
  // Framebuffer textures are already in WebGL orientation
  if (u_flipY) {
    v_texCoord.y = 1.0 - v_texCoord.y;
  }

  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

### Fragment Shader Example (Vignette)

Each effect has its own fragment shader:

```glsl
#version 300 es
precision highp float;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_size;
uniform float u_roundness;
uniform float u_smoothness;

out vec4 outColor;

float sdSquare(vec2 point, float width) {
  vec2 d = abs(point) - width;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float vignette(vec2 uv, float size, float roundness, float smoothness) {
  uv -= 0.5;
  float boxSize = size * (1.0 - roundness);
  float dist = sdSquare(uv, boxSize) - (size * roundness);
  return 1.0 - smoothstep(0.0, smoothness, dist);
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  float v = vignette(v_texCoord, u_size, u_roundness, u_smoothness);
  outColor = vec4(texel.rgb * v, texel.a);
}
```

---

## Data Flow

### Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Interaction                          │
└──────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    InfiniteCanvas Component                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │ Mouse Events   │  │ Keyboard Events│  │ Drop Events        │  │
│  │ - mousedown    │  │ - delete       │  │ - image files      │  │
│  │ - mousemove    │  │ - ctrl+a       │  │                    │  │
│  │ - mouseup      │  │ - tab          │  │                    │  │
│  └───────┬────────┘  └───────┬────────┘  └─────────┬──────────┘  │
└──────────┼───────────────────┼─────────────────────┼─────────────┘
           │                   │                     │
           ▼                   ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Jotai Atoms                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    canvasStateAtom                          │ │
│  │  {                                                          │ │
│  │    transform: { offsetX, offsetY, scale },                  │ │
│  │    images: [{ id, url, position, size, shaderLayers }],     │ │
│  │    selectedImageIds: ["id1", "id2"]                         │ │
│  │  }                                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│           │                                                       │
│           ├── transformAtom (derived)                            │
│           ├── sortedImagesAtom (derived)                         │
│           ├── selectedImageIdsAtom (derived)                     │
│           └── selectedImageAtom (derived)                        │
└──────────────────────────────────────────────────────────────────┘
                                  │
                                  │ useAtomValue subscriptions
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    useCanvasRenderer Hook                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ requestAnimationFrame loop @ 60fps                         │  │
│  │                                                            │  │
│  │  1. Clear canvas                                           │  │
│  │  2. Draw grid (if visible)                                 │  │
│  │  3. For each image:                                        │  │
│  │     - Check if has shader layers                           │  │
│  │     - If yes: call useShaderRenderer.getProcessedImage()   │  │
│  │     - Draw image/processed canvas to main canvas           │  │
│  │  4. Draw selection UI for selected images                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                                  │
                                  │ if image has shaderLayers
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    useShaderRenderer Hook                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ getProcessedImage(image, shaderLayers, width, height)      │  │
│  │                                                            │  │
│  │  1. Generate cache key from image URL + layer properties   │  │
│  │  2. Check cache - return if hit                            │  │
│  │  3. Call ShaderCompositor.render()                         │  │
│  │  4. Copy WebGL canvas to new 2D canvas                     │  │
│  │  5. Cache and return                                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ShaderCompositor                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ render(image, layers)                                      │  │
│  │                                                            │  │
│  │  For each enabled layer (sorted by order):                 │  │
│  │    1. Get/compile shader program for layer type            │  │
│  │    2. Bind input texture (image or previous framebuffer)   │  │
│  │    3. Bind output (next framebuffer or screen)             │  │
│  │    4. Set uniforms from layer.properties                   │  │
│  │    5. Draw fullscreen quad                                 │  │
│  │    6. Swap ping-pong buffers                               │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Shader Panel Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       ShaderPanel Component                      │
│                                                                  │
│  selectedImageAtom ──────► Display shader layers for image      │
│                                                                  │
│  User adjusts slider ──────► updateShaderLayerAtom              │
│                                    │                             │
│                                    ▼                             │
│                            canvasStateAtom updated               │
│                                    │                             │
│                                    ▼                             │
│                            useCanvasRenderer re-renders          │
│                                    │                             │
│                                    ▼                             │
│                            useShaderRenderer cache miss          │
│                            (properties changed)                  │
│                                    │                             │
│                                    ▼                             │
│                            ShaderCompositor.render()             │
│                            with new uniform values               │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure Reference

```
src/
├── types/
│   ├── canvas.ts          # Position, Size, Transform types
│   ├── shader.ts          # Discriminated union shader types
│   ├── image.ts           # CanvasImage type
│   └── state.ts           # CanvasState type
│
├── store/
│   ├── atoms/
│   │   ├── canvas-atom.ts    # Main state + transform
│   │   ├── images-atom.ts    # Image CRUD operations
│   │   └── selection-atom.ts # Selection state
│   ├── actions/
│   │   └── shader-actions.ts # Shader layer CRUD
│   └── index.ts              # Re-exports
│
├── hooks/
│   ├── use-canvas-transform.ts  # Pan/zoom state
│   ├── use-canvas-renderer.ts   # Main render loop
│   ├── use-shader-renderer.ts   # WebGL processing
│   ├── use-drag-select.ts       # Selection/drag
│   └── use-resize-handles.ts    # Resize functionality
│
├── lib/
│   ├── canvas/
│   │   ├── constants.ts     # Grid sizes, limits
│   │   ├── transform.ts     # Coordinate conversion
│   │   └── geometry.ts      # Hit testing, handles
│   └── webgl/
│       ├── context.ts       # WebGL2 context creation
│       ├── program.ts       # Shader compilation
│       ├── texture.ts       # Texture management
│       ├── framebuffer.ts   # Framebuffer + ping-pong
│       ├── quad.ts          # Fullscreen quad
│       ├── compositor.ts    # Multi-pass rendering
│       └── index.ts         # Re-exports
│
├── shaders/
│   ├── quad.vert.ts                    # Vertex shader
│   ├── color-correction.frag.ts        # Basic adjustments
│   ├── hue-rotate.frag.ts              # HSB manipulation
│   ├── blend-mode.frag.ts              # Blend modes
│   ├── film-grain.frag.ts              # Noise effect
│   ├── duotone.frag.ts                 # Two-color mapping
│   ├── pixelate.frag.ts                # Pixelation
│   ├── threshold.frag.ts               # Binary threshold
│   ├── dither.frag.ts                  # Bayer dithering
│   ├── vignette.frag.ts                # Edge darkening
│   ├── chromatic-aberration.frag.ts    # RGB splitting
│   └── index.ts                        # Re-exports
│
└── components/
    └── canvas/
        ├── infinite-canvas.tsx   # Main component
        └── shader-panel.tsx      # Shader controls UI
```

---

## Performance Considerations

### Caching Strategy

1. **Image Cache**: Original images cached as `HTMLImageElement`
2. **Processed Cache**: Shader results cached by `imageUrl::layerHash`
3. **Cache Invalidation**: On any property change, cache key changes
4. **Cache Limit**: Max 50 processed images, FIFO eviction

### Optimization Techniques

1. **Render only when needed**: RAF loop, but state changes trigger re-render
2. **Offscreen processing**: WebGL work doesn't block main canvas
3. **Uniform caching**: Shader programs compiled once, reused
4. **Texture reuse**: Source textures cached in TextureCache

### Memory Management

```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    compositorRef.current?.dispose();  // Delete WebGL resources
    processedCacheRef.current.clear(); // Clear canvas cache
  };
}, []);
```
