varying vec2 uvs;
uniform sampler2D src;
uniform vec3 color;
uniform float progress;

void main() {
  vec3 col = color;
  float alpha = smoothstep(progress, 1.0, texture2D(src, uvs).a);
  gl_FragColor = vec4(col, alpha);
}
