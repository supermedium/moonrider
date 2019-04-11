varying vec3 vWorldPos;
varying vec3 vPos;
varying vec3 vNormal;

void main() {
  vNormal = normal;
  vPos = position;
  vWorldPos = (modelMatrix * vec4( position, 1.0 )).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
