varying vec2 uvs;
uniform sampler2D src;
uniform vec3 color;
uniform float time;

#define T time * 0.04

void main() {
  vec2 uv = uvs;
  uv += T * 0.05;
  vec3 col = texture2D(src, uv).xyz;
  float core = step(0.125, uvs.x);
  gl_FragColor = vec4(col * color, mix(1.0, 0.07, core));
}