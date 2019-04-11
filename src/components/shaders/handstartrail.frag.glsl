@import ../../constants/colors;

varying vec3 vWorldPosition;
varying vec2 uvs;
uniform float pulse;
uniform sampler2D src;

void main() {
  vec3 colorize = vWorldPosition-cameraPosition;
  colorize = clamp(colorize + 0.5, vec3(0.0), vec3(1.0));
  vec3 col = mix(mix(COLOR_RED, COLOR_BLUE, colorize.x), COLOR_YELLOW, colorize.z);
  col += vec3(pulse) * 0.1;
  gl_FragColor = vec4 (col, texture2D(src, uvs).a);
}
