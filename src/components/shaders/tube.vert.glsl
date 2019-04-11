varying vec2 uvs;
uniform float time;
void main() {
  uvs.xy = uv.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
