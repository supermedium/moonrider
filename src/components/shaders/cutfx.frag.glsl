varying vec2 uvs;
varying float cutProgress;
uniform sampler2D src;
uniform vec3 color;
uniform float progress;

void main() {
  vec4 tex = texture2D(src, uvs);
  float isGlow = step(0.5, uvs.y);
  float isArc =  step(0.05, uvs.y) - step(0.51, uvs.y);
  float isCut =  1.0 - step(0.05, uvs.y);

  vec3 col = mix(tex.rgb, color, isGlow);

  float alpha = smoothstep(progress, 1.0, tex.a);
  alpha = mix(alpha, smoothstep(1.0 - sin(progress * 3.1415), 1.0, tex.a), isArc);
  alpha = mix(alpha, smoothstep(cutProgress, 1.0, tex.a), isCut);
  gl_FragColor = vec4(col, alpha);
}
