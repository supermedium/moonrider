varying vec2 uvs;
uniform vec3 color1;
uniform vec3 color2;

void main () {
  float mixDistance = distance(uvs, vec2(0.5, 0));
  float alphaDistance = 0.5 - distance(uvs, vec2(0.5));
  gl_FragColor = vec4(mix(color1, color2, pow(mixDistance, 2.4)), sqrt(alphaDistance));
}
