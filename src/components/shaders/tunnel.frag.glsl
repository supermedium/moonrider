uniform sampler2D src;
uniform float scale;
varying vec3 vPos;
varying vec3 vWorldPos;
varying vec3 vNormal;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 fogColor;

void main() {
  vec3 pw = vWorldPos - cameraPosition;
  vec3 p = pw / scale;
  float pz = p.z * 0.3;

  // build color weights
  float f = clamp( (sin(p.x * 0.6 + pz ) + sin(p.y * 0.3 - pz)) * 0.3 + 0.17, 0.0, 1.0);
  float g = clamp( (sin(p.x * 0.7 + pz) + cos(p.y * 0.6 - 15.0) + sin(pz * 0.1)) * 0.25 + 0.15, 0.0, 1.0);
  float h = clamp( (sin(p.x * 0.4 + pz + 3.0) + cos(p.y * 0.8 - 5.0) + sin(pz * 0.3)) * 0.16 + 0.08, 0.0, 1.0);


  // mix colors using weights
  vec3 col = vec3(0.3);
  col = mix(col, color1, f);
  col = mix(col, color2, g);
  col = mix(col, color3, h);

  float fog = 1.0 - clamp(length(pw) / 180.0 - 0.1, 0.0, 1.0);

  // mix color with fog
  col = mix(fogColor, col, smoothstep(0.2, 0.9, fog));

  // calc shadow (using normal and fixed light pos + fade to black in y)
  float shadow = 0.5 + dot(vec3(0.0, 1.0, 1.0), vNormal) * 0.5;
  float shadowGrad = clamp((vPos.y + 2.0) / 6.0, 0.1, 1.0);
  // fade in fog
  shadow = mix(1.0, shadow, fog);
  shadowGrad = mix(1.0, shadowGrad, smoothstep(0.3, 1.0, fog));

  gl_FragColor = vec4(col * shadow * shadowGrad, smoothstep(0.3, 0.6, fog));
  //gl_FragColor = vec4(vec3(fog), 1.0);
}