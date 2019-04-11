varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUV.xy = uv.xy;
  //vNormal.xyz = normal.xyz;
  vNormal = normalize(normalMatrix * normal);

  vec4 p = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vWorldPos = (modelMatrix * vec4( position, 1.0 )).xyz;
  gl_Position = p;
}