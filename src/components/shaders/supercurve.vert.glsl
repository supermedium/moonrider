varying vec2 vUvs;
varying vec3 vWorldPos;

void main() {
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vUvs = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
