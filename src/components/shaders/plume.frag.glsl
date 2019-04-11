varying vec2 uvs;
varying float distance;
uniform sampler2D src;
uniform vec3 color;

void main() {
  float alpha = texture2D(src, uvs).a;
  alpha *= 1.0 - clamp(distance / 40.0, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
