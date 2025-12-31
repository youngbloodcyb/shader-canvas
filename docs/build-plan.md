## Overview

An infinite canvas of images where the user can apply shaders.

Built with: tanstack start|shadcn/ui|base/ui|bun|jotai

## Project Plan

1. Build the infinite canvas component
2. Build state management for the canvas with Jotai
3. Build shader layer application
4. Build image uploads with Vercel Blob
5. Persist shader canvases to Upstash Redis

### 1) Build the infinite canvas component

Do not use any third party dependencies. Use `<canvas>` and core React hooks to build a component called `InfiniteCanvas`. This component's background should be a grid. The user should be able to add images to the canvas and resize them.

### 2) Build the state management for the canvas with Jotai

Use jotai as the state management library for the canvas. It should follow the following structure: A canvas can add many images. Each image that is added can have many shader layers. Each shader layer has its own respective properties (eg. brightness, density, etc.). Ensure that each shader type is safely typed. As the developer, I should be able to define a new type of shader easily and add it to the codebase.

Add comprehensive tests with Vitest. Tests should include (but are not limited to):

- CRUD operations for an image (add, delete, alter)
- moving an image position
- updating an image size
- CRUD operations for shader layers

### 3) Build the shader layer application

When a shader is created, it should be rendered using WebGL and GLSL. Each shader should be able to be added independently of each other.

### 4) Build image uploads with Vercel Blob

When an image is uploaded to the canvas, save it to Vercel Blob so that it is persisted.

### 5) Persist shader canvases to Upstash Redis

Save the canvas state to Upstash Redis so the user can come back to previous sessions. Use [Tanstack Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) to save the state to Redis.
