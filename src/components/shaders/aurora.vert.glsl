uniform float time;
varying vec2 uvs;
void main() {
  uvs.xy = uv.xy;
  float t = time * 0.0005;
  vec3 pos = position;
  pos.y += sin(t + uv.x * 3.0 + pos.x * 0.01) * 20.0;
  pos.y += sin(-t * 1.3 + uv.x * 7.0 + pos.x * 0.008) * 10.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}