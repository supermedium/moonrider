varying vec2 uvs;
varying vec3 nrml;
varying vec3 worldPos;

void main() {
  uvs.xy = uv.xy;
  nrml.xyz = normal.xyz;
  vec4 p = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  worldPos = (modelMatrix * vec4( position, 1.0 )).xyz;
  gl_Position = p;
}
