varying vec2 vUvs;
varying vec3 vWorldPos;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 fogColor;
uniform float opacity;

#define BLACK vec3(0.0)
#define YELLOW vec3(250.0 / 255.0, 244.0 / 255.0, 180.0 / 255.0)

void main() {
  vec3 col;

  // Lines.
  float f1 = clamp(sin(vUvs.x * 12.9 + 1.4) - 0.99, 0.0, 1.0) * 80.0;
  float f2 = clamp(sin(3.1416 + vUvs.x * 12.9 + 1.45) - 0.99, 0.0, 1.0) * 80.0;

  // Gradients.
  f1 += sin(vWorldPos.y - vWorldPos.x - vWorldPos.z * 0.4 + 1.4) * 0.1 + 0.1;
  f2 += sin(vWorldPos.y - vWorldPos.x - vWorldPos.z * 0.3 + 5.5) * 0.1 + 0.1;
  float f3 = sin(vWorldPos.y - vWorldPos.x - vWorldPos.z * 0.1 + 10.3) * 0.1 + 0.1;

  // Build color.
  col = mix(BLACK, color1, f1);
  col = mix(col, color2, f2);
  col = mix(col, YELLOW, f3);

  // Fog.
  float far = 100.0;
  float fog = 1.0 - clamp(length(vWorldPos - cameraPosition) / 400.0, 0.0, 1.0);

  col = mix(fogColor, col, fog);

  // fade beginning and end
  float alpha = 0.0;
  alpha += smoothstep(0.0, 0.003, vUvs.y);
  alpha -= smoothstep(0.997, 1.0, vUvs.y);

  gl_FragColor = vec4(col, alpha * (fog * fog));
}
