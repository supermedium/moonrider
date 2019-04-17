varying vec2 uvs;
varying float cutProgress;
uniform float progress;
void main() {
  uvs.xy = uv.xy;
  vec3 pos = position;
  float isGlow = step(0.5, uvs.y);
  float isArc =  step(0.05, uvs.y) - step(0.51, uvs.y);
  float isCut =  1.0 - step(0.05, uvs.y);
  cutProgress = clamp(0.0, 1.0, progress * 1.8);
  // move arc sprite
  pos.z -= mix(0.0, -0.5 + progress * 0.6, isArc);
  // move cut sprite
  pos.x += mix(0.0, -0.3 + cutProgress * uvs.x * 1.7 , isCut);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
