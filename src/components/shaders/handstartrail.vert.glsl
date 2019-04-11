varying vec3 vWorldPosition;
varying vec2 uvs;

void main() {
  uvs = uv;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
