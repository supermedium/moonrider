#define T time * 0.06
varying vec2 uvs;
uniform float time;
uniform float thickness;
void main() {
  uvs.xy = uv.xy;
  vec3 pos = position;

  pos.x *= thickness + sin(T) * ((0.1 + uv.x) * 16.0 + uv.y * 4.9) * thickness * 0.005;
  pos.z *= thickness + cos(T) * ((0.1 + uv.x) * 13.0 + uv.y * 14.9) * thickness * 0.005;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}