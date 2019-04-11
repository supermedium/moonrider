varying vec3 vWorldPosition;
varying float fresnel;
uniform float pulse;

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
  vec3 viewVector =  normalize(vWorldPosition - cameraPosition);
  fresnel = 0.08 * pow(0.4 + dot(viewVector, worldNormal), 6.0 + pulse);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
