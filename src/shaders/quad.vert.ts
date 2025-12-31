/**
 * Vertex shader for fullscreen quad rendering
 */
export const quadVertexShader = `#version 300 es

in vec2 a_position;

uniform bool u_flipY;

out vec2 v_texCoord;

void main() {
  // Convert from clip space (-1 to 1) to texture coordinates (0 to 1)
  v_texCoord = (a_position + 1.0) * 0.5;

  // Flip Y coordinate only for image textures (first pass)
  // Framebuffer textures are already in correct orientation
  if (u_flipY) {
    v_texCoord.y = 1.0 - v_texCoord.y;
  }

  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;
