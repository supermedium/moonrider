varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vWorldPos;
uniform sampler2D src;
//uniform float time;

//#define T time * 0.04

void main() {
  //vec2 uv = vUV;
  vec3 eye = normalize(cameraPosition - vWorldPos);
  vec3 ray = reflect(eye, vNormal);
  float m = 2.0 * sqrt(pow(ray.x, 2.0) + pow(ray.y, 2.0) + pow(ray.z, 2.0));
  vec2 envuv = ray.xy / m + 0.5;
  vec3 col = texture2D(src, envuv).xyz;

  vec3 light = normalize(vWorldPos + vec3(0.1, 3.0, 0.5));
  float diff = 0.1 + dot(light, vNormal) * 0.3;

  float fresnel = 1.0 - clamp(pow(vNormal.z, 0.2), 0.0, 1.0);

  gl_FragColor = vec4(mix(vec3(diff), col, fresnel), 1.0);
}