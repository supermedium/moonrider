uniform float time;
uniform vec3 colorPrimary;
uniform vec3 colorSecondary;
uniform vec3 colorTertiary;
varying vec2 uvs;
#define PI 3.14159265358979

float pulse(float x, float t, float r){
  return 1.0 - smoothstep(0.0, r, abs((x - t)));
}

void main() {
  float t = time * 0.002;
  vec2 uv = uvs - 0.5;
  uv = vec2(-uv.y, uv.x);
  float d = length(uv);
  float f = pulse(d, 0.44, 0.012);
  float f2 = pulse(d, 0.44, 0.002);

  float g = pulse(d, 0.20, 0.01);
  float g1 = pulse(d, 0.20, 0.0018);

  float g2 = pulse(d, 0.21, 0.01);
  float g3 = pulse(d, 0.21, 0.0018);

  float ang = abs(atan(uv.y, uv.x)) / PI;
  float angalpha = sin(ang * 20.0 - t * 0.1) * 0.4 + 0.6;

  float sparks = pulse(angalpha, 0.4, 0.17) * (pulse(d, 0.435, 0.035) + pulse(d, 0.205, 0.026)) * 0.14;
  sparks += pulse(angalpha, 0.4, 0.2) * (pulse(d, 0.44, 0.002) + pulse(d, 0.2, 0.0018)) * 0.4;
  sparks *= sin(ang * 14.0 + t) * 0.5 + 0.5;
  vec3 col = mix(colorPrimary, colorSecondary, ang);
  col = mix (col, colorPrimary, g3);
  col = mix (col, colorSecondary, g1);
  col = mix (col, colorTertiary, sparks * 2.4);
   gl_FragColor = vec4(col, ((f + g + g2) * 0.1 + (f2 + g1 + g3) * 0.4) * angalpha + sparks);
}
