varying vec3 vWorldPosition;
varying float fresnel;
uniform float pulse;
uniform vec3 colorPrimary;
uniform vec3 colorSecondary;
uniform vec3 colorTertiary;

void main() {
  vec3 colorize = vWorldPosition-cameraPosition;
  colorize = clamp(colorize + 0.5, vec3(0.0), vec3(1.0));
  vec3 col = mix(mix(colorPrimary, colorSecondary, colorize.x), colorTertiary, colorize.z);
  col += (fresnel * pulse) * 0.1;
  gl_FragColor = vec4 (col, clamp(fresnel, 0.0, 1.0));
}
