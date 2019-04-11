varying vec2 uvs;
uniform sampler2D map;
uniform vec3 tint;

void main() {
  vec4 tex = texture2D(map, uvs);
  vec3 col = mix(tex.rgb * tint, tex.rgb, uvs.y);
  gl_FragColor = vec4(col, tex.a );
}
