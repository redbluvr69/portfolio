#version 300 es

precision highp float;

in vec4 v_color;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

#define MAX_BLUR_RADIUS (100)
uniform int u_blurRadius;
uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdQuadraticCircle(vec2 p) {
  p = abs(p);
  if (p.y > p.x) p = p.yx; // symmetries

  float a = p.x - p.y;
  float b = p.x + p.y;
  float c = (2.0 * b - 1.0) / 3.0;
  float h = a * a + c * c * c;
  float t;
  if (h >= 0.0) {
    h = sqrt(h);
    t = sign(h - a) * pow(abs(h - a), 1.0 / 3.0) - pow(h + a, 1.0 / 3.0);
  } else {
    float z = sqrt(-c);
    float v = acos(a / (c * z)) / 3.0;
    t = -z * (cos(v) + sin(v) * 1.732050808);
  }
  t *= 0.5;
  vec2 w = vec2(-t, t) + 0.75 - t * t - p;
  return length(w) * sign(a * a * 0.5 + b - 1.5);
}

vec3 sdSuperellipse(vec2 p, float r, float n) {
  p = p / r;
  vec2 gs = sign(p);
  vec2 ps = abs(p);
  float gm = pow(ps.x, n) + pow(ps.y, n);
  float gd = pow(gm, 1.0 / n) - 1.0;
  vec2 g = gs * pow(ps, vec2(n - 1.0)) * pow(gm, 1.0 / n - 1.0);
  p = abs(p);
  if (p.y > p.x) p = p.yx;
  n = 2.0 / n;
  float s = 1.0;
  float d = 1e20;
  const int num = 24;
  vec2 oq = vec2(1.0, 0.0);
  for (int i = 1; i < num; i++) {
    float h = float(i) / float(num - 1);
    vec2 q = vec2(pow(cos(h * 3.1415927 / 4.0), n), pow(sin(h * 3.1415927 / 4.0), n));
    vec2 pa = p - oq;
    vec2 ba = q - oq;
    vec2 z = pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float d2 = dot(z, z);
    if (d2 < d) {
      d = d2;
      s = pa.x * ba.y - pa.y * ba.x;
    }
    oq = q;
  }
  return vec3(sqrt(d) * sign(s) * r, g);
}

// float squircle(in vec2 pos, in float rad4) {
//     vec2 tmp = pos * pos;
//     vec2 deriv = 4.0 * pos * tmp;
//     tmp = tmp * tmp;
//     float val4 = dot(vec2(1.0, 1.0), tmp);
//     float deriv_mag = length(deriv);
//     float sdf = (val4 - rad4) / deriv_mag;
//     // return clamp(0.5 * sdf * iResolution.y, 0.0, 1.0);

//     return sdf;
// }

float sdRoundBox(vec2 p, vec2 b, vec4 r) {
  r.xy = p.x > 0.0 ? r.xy : r.zw;
  r.x = p.y > 0.0 ? r.x : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// vec3 sdgSMin( in vec3 a, in vec3 b, in float k )
// {
//     k *= 4.0;
//     float h = max( k-abs(a.x-b.x), 0.0 )/(2.0*k);
//     return vec3( min(a.x,b.x)-h*h*k,
//                  mix(a.yz,b.yz,(a.x<b.x)?h:1.0-h) );
// /*
//     k *= 4.0;
//     float h = max( k-abs(a.x-b.x), 0.0 )/k;
//     float m = h*h*k*(1.0/4.0);
//     float n = h*(1.0/2.0);
//     return (a.x<b.x) ? vec3(a.x-m, mix(a.yz, b.yz, n) ):
//                        vec3(b.x-m, mix(a.yz, b.yz, 1.0-n) );
// */
// }

vec3 sdgMin(vec3 a, vec3 b) {
  return a.x < b.x
    ? a
    : b;
}

// quartic polynomial
// float smin( float a, float b, float k )
// {
//     k *= 16.0/3.0;
//     float x = (b-a)/k;
//     float g = (x> 1.0) ? x :
//               (x<-1.0) ? 0.0 :
//               (x+1.0)*(x+1.0)*(3.0-x*(x-2.0))/16.0;
//     return b - k * g;
// }

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// quadratic polynomial
// float smin( float a, float b, float k )
// {
//     k *= 4.0;
//     float h = max( k-abs(a-b), 0.0 )/k;
//     return min(a,b) - h*h*k*(1.0/4.0);
// }

float chessboard(vec2 uv, float size) {
  float yBars = step(size * 2.0, mod(uv.y, size * 4.0));
  float xBars = step(size * 2.0, mod(uv.x, size * 4.0));
  return abs(yBars - xBars);
}

void main() {
  // vec2 p1 = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
  //
  // float d1 = sdBox(p1, vec2(200.0, 30.0) / u_resolution.y);
  // float d1 = sdCircle(p1, 200.0 / u_resolution.y);
  // float a1 = smoothstep(0.0, 0.003, d1);

  // vec2 p2 = (gl_FragCoord.xy - u_mouse) / u_resolution.y;
  // float d2 = sdCircle(p2, 100.0 / u_resolution.y);
  // float d2 = sdQuadraticCircle(p2 / 0.2) * 0.2;
  // float d2 = sdSuperellipse(p2, 200.0 / u_resolution.y, 4.0).x;
  // float d2 = sdRoundBox(p2, vec2(300.0, 100.0) / u_resolution.y, vec4(100.0 / u_resolution.y));

  //

  // float merged = smin(d1, d2, 0.05);

  // float px = 2.0/u_resolution.y;
  // vec3 col = (merged>0.0) ? vec3(0.9,0.6,0.3) : vec3(0.65,0.85,1.0);
  // // 阴影
  // col *= 1.0 - exp(-0.03*abs(merged) * u_resolution.y);
  // // 等高线
  // col *= 0.6 + 0.4*smoothstep(-0.5,0.5,cos(0.25 *abs(merged) * u_resolution.y));
  // // 外层白框
  // col = mix( col, vec3(1.0), 1.0-smoothstep(0.003-px,0.003+px,abs(merged)));
  // fragColor = vec4(col,1.0);

  // float smoothed = smoothstep(0.0, 0.0005, merged);
  // fragColor = vec4(vec3(smoothed), 1.0);

  vec2 p1 = (gl_FragCoord.xy - u_resolution.xy * 0.5) / u_resolution.y;
  vec2 p2 = (gl_FragCoord.xy - u_mouse) / u_resolution.y;
  float d1 = sdCircle(p1, 200.0 / u_resolution.y);
  float d2 = sdSuperellipse(p2, 200.0 / u_resolution.y, 4.0).x;

  float merged = smin(d1, d2, 0.05);
  // float smoothed = smoothstep(0.0, 0.0005, merged);

  vec4 BgColor;
  float chessboardBg = 1.0 - chessboard(gl_FragCoord.xy, 50.0) / 4.0;
  if (merged < 0.0) {
    // // blur background:
    // // gaussian blur
    // float Pi = 6.28318530718; // Pi*2
    // // GAUSSIAN BLUR SETTINGS {{{
    // float Directions = 264.0; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
    // float Quality = 22.0; // BLUR QUALITY (Default 4.0 - More is better but slower)
    // float Size = 100.0; // BLUR SIZE (Radius)
    // // }}}
    // vec2 Radius = Size / u_resolution.xy;
    // // chess board bg

    // BgColor = vec4(vec3(chessboard(bguv)), 1.0);
    // for (float d = 0.0; d < Pi; d += Pi / Directions) {
    //   for (float i = 1.0 / Quality; i <= 1.0; i += 1.0 / Quality) {
    //     BgColor += vec4(vec3(chessboard(bguv + vec2(cos(d), sin(d)) * Radius * i)), 1.0); // texture( iChannel0, uv+vec2(cos(d),sin(d))*Radius*i);
    //   }
    // }
    // BgColor /= Quality * Directions - 15.0;
    // BgColor = vec4(vec3(1.0 - chessboardBg), 1.0);

    // blur
    float c = chessboard(gl_FragCoord.xy, 50.0) * u_blurWeights[0];
    float weightSum = u_blurWeights[0];

    for (int i = 1; i <= u_blurRadius; i++) {
      if (i > u_blurRadius) break;

      float w = u_blurWeights[i];

      c += chessboard(gl_FragCoord.xy + vec2(float(i), 0.0), 50.0) * w;
      c += chessboard(gl_FragCoord.xy + vec2(-float(i), 0.0), 50.0) * w;
      c += chessboard(gl_FragCoord.xy + vec2(0.0, float(i)), 50.0) * w;
      c += chessboard(gl_FragCoord.xy + vec2(0.0, -float(i)), 50.0) * w;

      weightSum += w * 4.0;
    }
    c /= weightSum;
    BgColor = vec4(vec3(c), 1.0);
  } else {
    // BgColor = vec4(vec3(chessboard(bguv)), 1.0);
    BgColor = vec4(vec3(chessboardBg), 1.0);
  }

  // float smoothed = smoothstep(0.0, 0.0005, merged);
  // fragColor = vec4(mix(vec3(BgColor), vec3(smoothed), 0.0), 1.0);

  fragColor = BgColor;

  // float normalizedInside = merged / u_shapeHeight / u_resolution.y + 1.0;
  // float edgeBlendFactor = pow(normalizedInside, 12.0);
  // float smoothed = smoothstep(0.0, 0.0005, merged);

  // vec4 outColor;
  // if (merged < 0.0) {
  // outColor = texture(u_blurredBg, v_uv);
  // outColor = texture(u_blurredBg, v_uv);

  // float px = 2.0 / u_resolution.y;
  // vec3 col = merged > 0.0 ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
  // // 阴影
  // col *= 1.0 - exp(-0.03 * abs(merged) * u_resolution.y);
  // // 等高线
  // col *= 0.6 + 0.4 * smoothstep(-0.5, 0.5, cos(0.25 * abs(merged) * u_resolution.y));
  // // 外层白框
  // col = mix(col, vec3(1.0), 1.0 - smoothstep(0.003 - px, 0.003 + px, abs(merged)));

  // float edgeEffect = pow(clamp(1.0 + merged * u_refEdge * u_resolution.y, 0.0, 1.0), 2.0);
  // float edgeEffect = 1.0;

  // if (edgeEffect > 0.0) {
  //   vec2 normal = getNormal(p1, p2, gl_FragCoord.xy);
  // vec3 normalColor = vec3((normal * 0.5 + 0.5) * edgeEffect, 0.0);
  // vec3 normalColor = vec3(clamp(normal.x, 0.0, 1.0), abs(normal.y), clamp(-normal.x, 0.0, 1.0));
  // vec3 normalColor = vec3()
  // // view edge
  // outColor = vec4(vec3(edgeEffect), 1.0);
  // // view normal
  // outColor = vec4(normalColor, 1.0);

  // outColor.r = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.6).r;
  // outColor.g = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.4).g;
  // outColor.b = texture(u_blurredBg, v_uv + normal * pow(edgeEffect * 0.5, 2.0) * 0.8).b;

  // final color
  // outColor = texture(u_blurredBg, v_uv - normal * pow(edgeEffect, 5.0) * 30.0 / 800.0);

  // outColor.r = texture(
  //   u_blurredBg,
  //   v_uv - normal / gl_FragCoord.y * pow(edgeEffect, 5.0) * 30.0 * 1.0
  // ).r;
  // outColor.g = texture(
  //   u_blurredBg,
  //   v_uv - normal / gl_FragCoord.y * pow(edgeEffect, 5.0) * 30.0 * 1.0
  // ).g;
  // outColor.b = texture(
  //   u_blurredBg,
  //   v_uv - normal / gl_FragCoord.y * pow(edgeEffect, 5.0) * 30.0 * 1.0
  // ).b;

  //   } else {
  //     outColor = texture(u_blurredBg, v_uv);
  //   }

  //   outColor = mix(outColor, vec4(u_tint.r, u_tint.g, u_tint.b, u_tint.a * 0.5), u_tint.a * 0.5);

  //   // outColor = vec4(mix(texture(u_blurredBg, v_uv).rgb, vec3(1.0), edgeEffect), 1.0);

  // } else {
  //   outColor = texture(u_bg, v_uv);
  // }

}
