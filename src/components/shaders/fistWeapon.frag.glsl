varying vec2 uvs;
uniform sampler2D src;
uniform vec3 color;
uniform float time;

#define T time * 0.03

void main() {
  vec3 col = texture2D(src, uvs * vec2(1.0, 0.7) + vec2(T * 0.01, T * 0.05)).xyz;
  gl_FragColor = vec4(col * color, 0.4 * uvs.y);
}
