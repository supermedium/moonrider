varying vec2 uvs;
varying vec3 vWorldPos;
uniform sampler2D src;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;

void main() {
  vec4 tex = texture2D(src, uvs);
  vec3 p = vWorldPos + cameraPosition;
  float pz = p.z * 0.36;
  float f = clamp( (sin(p.x + pz ) + sin(p.y - pz)) * 0.35 + 0.14, 0.0, 1.0);
  float g = clamp( (sin(p.x + pz + 2.0) + cos(p.y * 0.6 - 15.0) + sin(pz * 0.5)) * 0.3 + 0.1, 0.0, 1.0);
  float h = clamp( (sin(p.x * 0.7 + pz + 2.0) + cos(p.y * 0.8 - 5.0) + sin(pz * 0.8)) * 0.3 + 0.05, 0.0, 1.0);

  vec3 col = vec3(0.1);
  col = mix(col, color1, f);
  col = mix(col, color2, g);
  col = mix(col, color3, h);

  gl_FragColor = vec4((col * 1.5) * tex.r, 1.0);
}