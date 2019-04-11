varying vec2 uvs;
varying float distance;
void main() {
  uvs.xy = uv.xy;
  distance = length((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
