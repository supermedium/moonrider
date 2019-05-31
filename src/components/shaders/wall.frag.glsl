uniform float iTime;
uniform float opacity;
uniform sampler2D environment;
uniform vec3 colorTertiary;
uniform vec3 hitLeft;
uniform vec3 hitRight;
varying vec2 uvs;
varying vec3 nrml;
varying vec3 worldPos;

#define SEED 19.1252
#define time (3.0 + iTime) / 1000.0

float noise(vec3 uv) {
  return fract(sin(uv.x*123243. + uv.y*424. + uv.z*642. + SEED) * 1524.);
}

vec4 drawHit(vec3 p, vec3 center, vec3 color) {
  center.z -= 0.1;
  float dist = 1.0 - smoothstep(0.0, 0.3, length(p - center));
  float glitch = noise(floor(p*3.0)) * 0.06 - 0.03;
  float alpha = 1.0 - smoothstep(0.0, 0.01, abs(p.z-center.z + glitch));
  alpha += 1.0 - smoothstep(0.0, 0.01, abs(p.y-center.y + glitch));
  return vec4(color * dist, alpha * dist + alpha);
}

void main() {
  vec2 uv1 = uvs.xy-0.5;
  float alpha = 0.0;
  // border
  alpha += smoothstep(0.44, 0.50, abs(uv1.x));
  alpha += smoothstep(0.44, 0.50, abs(uv1.y));
  alpha += smoothstep(0.486, 0.49, abs(uv1.x));
  alpha += smoothstep(0.486, 0.49, abs(uv1.y));
  alpha = min(1.0, alpha * 0.5);

  // weapon collision
  vec4 hit;
  hit = drawHit(worldPos, hitRight, colorTertiary);
  hit += drawHit(worldPos, hitLeft, colorTertiary);

  // reflection
  vec3 ray = reflect(normalize(cameraPosition - worldPos + sin(worldPos.z) * 0.1 + cos(worldPos.z * 0.3) * 0.3), nrml);
  float m = 2.0 * sqrt(pow(ray.x, 2.0) + pow(ray.y, 2.0) + pow(ray.z, 2.0));
  vec2 uv = ray.xy / m + 0.5;
  vec3 col = texture2D(environment, uv).rgb * 0.3;

  gl_FragColor = vec4(mix(col, colorTertiary, alpha) + hit.rgb, (alpha * 0.2 + 0.8) * opacity + hit.a);
}
