varying vec2 uvs;
uniform sampler2D src;

void main() {
  gl_FragColor = texture2D(src, uvs);
}