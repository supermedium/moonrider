#if __VERSION__ == 100
  #extension GL_OES_standard_derivatives : enable
#endif

uniform vec3 colorPrimary;
uniform vec3 colorSecondary;

#define PI 3.141592
#define DIFF_SECTION_WIDTH 0.06

uniform float borderWidth;
uniform float borderRadius;
uniform float brightness;
uniform float ratio;
uniform float midSection;
uniform float opacity;
uniform float activePanel;

varying vec2 uvs;

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,vec2(0.0))) + min(max(d.x,d.y), 0.0);
}

void main()
{
  vec2 uv = uvs;
  vec2 uv2 = uv * 2.0 - 1.0; // from -1 to 1
  uv2.x *= ratio;

  vec3 col = mix(colorSecondary * uv.y, colorPrimary * uv.y, uv.x) * (brightness + activePanel * 0.4);
  vec3 borderCol = mix(colorSecondary, colorPrimary, uv.y);

  vec2 size = vec2(0.83 * ratio, 0.86) - borderRadius;
  float grad = sdBox(uv2, size) - borderRadius;
  grad = min(grad, sdBox(uv2 - size, vec2(borderRadius)));
  grad = min(grad, sdBox(uv2 + size, vec2(borderRadius)));
  grad = -grad;
  float aa = fwidth(grad);

  float isShape = smoothstep(-aa, 0.0, grad);
  float alpha = clamp(isShape + smoothstep(-0.15, 0.15, grad), 0.0, 1.0);
  float isBorder = smoothstep(-aa - borderWidth, aa - borderWidth, grad) - smoothstep(-aa + borderWidth, aa + borderWidth, grad);
  float mid = clamp(midSection, 0.0, 1.0);
  col *= 1.0 - mid * (step(0.5 - DIFF_SECTION_WIDTH * mid, uv.x) - step(0.5 + DIFF_SECTION_WIDTH * midSection, uv.x)) * 0.3;

  gl_FragColor = vec4(mix(col * isShape, borderCol, isBorder), alpha * opacity);
}
