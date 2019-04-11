@import ../../constants/colors;

varying vec3 vWorldPosition;
varying float fresnel;
uniform float pulse;

void main() {
  vec3 colorize = vWorldPosition-cameraPosition;
  colorize = clamp(colorize + 0.5, vec3(0.0), vec3(1.0));
  vec3 col = mix(mix(COLOR_RED, COLOR_BLUE, colorize.x), COLOR_YELLOW, colorize.z);
  col += (fresnel * pulse) * 0.1;
  gl_FragColor = vec4 (col, clamp(fresnel, 0.0, 1.0));
}
