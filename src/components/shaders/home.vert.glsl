uniform float time;
varying vec3 vWorldPos;
varying vec2 uvs;
void main() {
  uvs.xy = uv.xy;
  vWorldPos = (modelMatrix * vec4( position, 1.0 )).xyz;
  vec3 pos = vec3(position.x, position.y + sin(time * 0.002 - position.z) * 0.05 + 0.04, position.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
