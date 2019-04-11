varying vec2 uvs;
uniform sampler2D src;
uniform sampler2D color;
uniform float time;
uniform float opacity;

void main() {
  vec2 uvanim = vec2(
    mod(uvs.x + sin(time / 20000.0), 1.0),
    mod(uvs.y + time / 2000.0, 1.0));
  vec4 texAlpha = texture2D(src, uvanim);
  float alpha = texAlpha.a * smoothstep(0.0, 0.5, uvs.y) * (1.0 - smoothstep(0.5, 1.0, uvs.y));
  gl_FragColor = vec4(texture2D(color, uvs).rgb, alpha * 0.7 * opacity);
}
