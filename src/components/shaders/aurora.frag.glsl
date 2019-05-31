uniform float time;
uniform vec3 colorPrimary;
uniform vec3 colorSecondary;
varying vec2 uvs;

void main() {
  vec3 col = vec3(1.0);
  float t = time * 0.001;
  col *= 0.80 + sin(-t * 3.4 + 5.5 + uvs.x * 6.0) * 0.1;
  col *= 0.80 + sin(t * 1.4 + 0.5 + uvs.x * 12.0) * 0.2;
  col *= 0.80 + sin(t * 1.0 + 0.2 + uvs.x * 30.0) * 0.2;
  col *= 0.90 + sin(-t * 1.6 + 5.2 + uvs.x * 43.0) * 0.1;
  col *= 0.95 + sin(-t * 0.3 + 1.2 + uvs.x * 50.0) * 0.05;
  col *= 0.95 + sin(t * 0.8 + 1.2 + uvs.x * 80.0) * 0.05;
  col *= 0.94 + sin(-t + 0.1 + uvs.x * 180.0) * 0.01;
  col *= 0.90 + sin(t * 2.49 + 0.1 + uvs.x * 120.0) * 0.01;
  col *= 0.86 + sin(-t * 1.7 + 4.7 + uvs.x * 80.0) * 0.03;
  col *= 0.86 + sin(-t * 1.2 + 0.7 + uvs.x * 180.0) * 0.02;

  // border fades
  float alpha = 1.0;
  alpha *= 1.0 - smoothstep(0.0, 1.0, uvs.y);
  alpha *= smoothstep(0.0, 0.3, uvs.y);
  alpha *= sin(uvs.x * 3.141592);

  // colorize
  col = col * mix(colorPrimary, colorSecondary, uvs.y);
  gl_FragColor = vec4(col, alpha);
}
