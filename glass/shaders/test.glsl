#version 300 es
precision mediump float;
in vec3 vVertexPosition;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform sampler2D uCustomTexture;
uniform float uScale;
uniform float uAngle;
uniform float uOpacity;
uniform float uMix;
uniform int uBlendMode;
uniform float uDispersion;
uniform int uShowBg;
uniform int uShape;
uniform int uInvert;
uniform int uMouseDistortDir;
uniform float uRefraction;
uniform float uMouseDistort;
uniform vec3 uColor;
uniform vec2 uPos;
uniform sampler2D uMaskTexture;
uniform int uIsMask;
uniform float uTrackMouse;
uniform vec2 uMousePos;
uniform vec2 uResolution;
uniform float uParentTrackMouse;
vec3 blend(int blendMode, vec3 src, vec3 dst) {
  if (blendMode == 0) {
    return src;
  }
  if (blendMode == 1) {
    return src + dst;
  }
  if (blendMode == 2) {
    return src - dst;
  }
  if (blendMode == 3) {
    return src * dst;
  }
  if (blendMode == 4) {
    return 1.0 - (1.0 - src) * (1.0 - dst);
  }
  if (blendMode == 5) {
    return vec3(
      dst.x <= 0.5
        ? 2.0 * src.x * dst.x
        : 1.0 - 2.0 * (1.0 - dst.x) * (1.0 - src.x),
      dst.y <= 0.5
        ? 2.0 * src.y * dst.y
        : 1.0 - 2.0 * (1.0 - dst.y) * (1.0 - src.y),
      dst.z <= 0.5
        ? 2.0 * src.z * dst.z
        : 1.0 - 2.0 * (1.0 - dst.z) * (1.0 - src.z)
    );
  }
  if (blendMode == 6) {
    return min(src, dst);
  }
  if (blendMode == 7) {
    return max(src, dst);
  }
  if (blendMode == 8) {
    return vec3(
      src.x == 1.0
        ? 1.0
        : min(1.0, dst.x / (1.0 - src.x)),
      src.y == 1.0
        ? 1.0
        : min(1.0, dst.y / (1.0 - src.y)),
      src.z == 1.0
        ? 1.0
        : min(1.0, dst.z / (1.0 - src.z))
    );
  }
  if (blendMode == 9) {
    return vec3(
      src.x == 0.0
        ? 0.0
        : 1.0 - (1.0 - dst.x) / src.x,
      src.y == 0.0
        ? 0.0
        : 1.0 - (1.0 - dst.y) / src.y,
      src.z == 0.0
        ? 0.0
        : 1.0 - (1.0 - dst.z) / src.z
    );
  }
  if (blendMode == 10) {
    return src + dst - 1.0;
  }
  if (blendMode == 11) {
    return vec3(
      src.x <= 0.5
        ? 2.0 * src.x * dst.x
        : 1.0 - 2.0 * (1.0 - src.x) * (1.0 - dst.x),
      src.y <= 0.5
        ? 2.0 * src.y * dst.y
        : 1.0 - 2.0 * (1.0 - src.y) * (1.0 - dst.y),
      src.z <= 0.5
        ? 2.0 * src.z * dst.z
        : 1.0 - 2.0 * (1.0 - src.z) * (1.0 - dst.z)
    );
  }
  if (blendMode == 12) {
    return vec3(
      src.x <= 0.5
        ? dst.x - (1.0 - 2.0 * src.x) * dst.x * (1.0 - dst.x)
        : src.x > 0.5 && dst.x <= 0.25
          ? dst.x +
          (2.0 * src.x - 1.0) * (4.0 * dst.x * (4.0 * dst.x + 1.0) * (dst.x - 1.0) + 7.0 * dst.x)
          : dst.x + (2.0 * src.x - 1.0) * (sqrt(dst.x) - dst.x),
      src.y <= 0.5
        ? dst.y - (1.0 - 2.0 * src.y) * dst.y * (1.0 - dst.y)
        : src.y > 0.5 && dst.y <= 0.25
          ? dst.y +
          (2.0 * src.y - 1.0) * (4.0 * dst.y * (4.0 * dst.y + 1.0) * (dst.y - 1.0) + 7.0 * dst.y)
          : dst.y + (2.0 * src.y - 1.0) * (sqrt(dst.y) - dst.y),
      src.z <= 0.5
        ? dst.z - (1.0 - 2.0 * src.z) * dst.z * (1.0 - dst.z)
        : src.z > 0.5 && dst.z <= 0.25
          ? dst.z +
          (2.0 * src.z - 1.0) * (4.0 * dst.z * (4.0 * dst.z + 1.0) * (dst.z - 1.0) + 7.0 * dst.z)
          : dst.z + (2.0 * src.z - 1.0) * (sqrt(dst.z) - dst.z)
    );
  }
  if (blendMode == 13) {
    return abs(dst - src);
  }
  if (blendMode == 14) {
    return src + dst - 2.0 * src * dst;
  }
  if (blendMode == 15) {
    return 2.0 * src + dst - 1.0;
  }
  if (blendMode == 16) {
    return vec3(
      src.x > 0.5
        ? max(dst.x, 2.0 * (src.x - 0.5))
        : min(dst.x, 2.0 * src.x),
      src.x > 0.5
        ? max(dst.y, 2.0 * (src.y - 0.5))
        : min(dst.y, 2.0 * src.y),
      src.z > 0.5
        ? max(dst.z, 2.0 * (src.z - 0.5))
        : min(dst.z, 2.0 * src.z)
    );
  }
  if (blendMode == 17) {
    return vec3(
      src.x <= 0.5
        ? 1.0 - (1.0 - dst.x) / (2.0 * src.x)
        : dst.x / (2.0 * (1.0 - src.x)),
      src.y <= 0.5
        ? 1.0 - (1.0 - dst.y) / (2.0 * src.y)
        : dst.y / (2.0 * (1.0 - src.y)),
      src.z <= 0.5
        ? 1.0 - (1.0 - dst.z) / (2.0 * src.z)
        : dst.z / (2.0 * (1.0 - src.z))
    );
  }

}
out vec4 fragColor;
const float PI = 3.14159265359;
mat2 rot(float a) {
  return mat2(cos(a), -sin(a), sin(a), cos(a));
}
float sdCircle(vec2 uv, float r) {
  return length(uv) - r;
}
float sdSquare(vec2 uv, float r) {
  return max(abs(uv.x), abs(uv.y)) - r;
}
float sdEquilateralTriangle(vec2 p, float r) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
float sdDiamond(vec2 p, float r) {
  p = abs(p);
  return (p.x + p.y - r) * 0.70710678118;
}
float sdPentagon(vec2 p, float r) {
  const vec3 k = vec3(0.809016994, 0.587785252, 0.726542528);
  p.x = abs(p.x);
  p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
  p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
  p -= vec2(clamp(p.x, -r * k.z, r * k.z), r);
  return length(p) * sign(p.y);
}
float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}
float sdOctagon(vec2 p, float r) {
  const vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623);
  p = abs(p);
  p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
  p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
  p -= vec2(clamp(p.x, -r * k.z, r * k.z), r);
  return length(p) * sign(p.y);
}
float sdVesica(vec2 p, float r) {
  float d = r;
  vec2 c1 = vec2(-d * 0.5, 0.0);
  vec2 c2 = vec2(d * 0.5, 0.0);
  return max(length(p - c1) - r, length(p - c2) - r);
}
float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
float sdArchway(vec2 p, float r_param) {
  p.y += 0.15;
  vec2 p_rect_center = vec2(0.0, 0);
  vec2 rect_half_extents = vec2(r_param, r_param);
  float d_rect = sdBox(p - p_rect_center, rect_half_extents);
  vec2 circle_center = vec2(0.0, r_param);
  float d_disk = length(p - circle_center) - r_param;
  float d_plane_above_rect_top = r_param - p.y;
  float d_semicircle = max(d_disk, d_plane_above_rect_top);
  return min(d_rect, d_disk);
}
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}
float screenPxRange(vec2 range) {
  vec2 unitRange = range / vec2(textureSize(uCustomTexture, 0));
  vec2 screenTexSize = vec2(1.0) / fwidth(vTextureCoord);
  return max(0.5 * dot(unitRange, screenTexSize), 1.0);
}
float sdCustom(vec2 uv) {
  ivec2 customTexSize = textureSize(uCustomTexture, 0);
  float customTexAspect = float(customTexSize.x) / float(customTexSize.y);
  if (
    float(customTexSize.x) == float(uResolution.x) &&
    float(customTexSize.y) == float(uResolution.y)
  ) {
    return 1.0;
  }
  uv.x /= customTexAspect;
  uv += 0.5;
  vec4 sdColor = texture(uCustomTexture, uv);
  float msdf = median(sdColor.r, sdColor.g, sdColor.b);
  float m = uInvert == 0 ? 1.0 - sdColor.a : sdColor.a;
  float sd = mix(msdf, sdColor.a, m);
  float screenPxDistance = screenPxRange(vec2(0.0833333)) * -(sd - 0.5);
  return screenPxDistance;
}
float sdX(vec2 p, float w) {
  p = abs(p);
  float d1 = sdBox(rot(PI / 4.0) * p, vec2(w, w * 0.3));
  float d2 = sdBox(rot(-PI / 4.0) * p, vec2(w, w * 0.3));
  return min(d1, d2);
}
float sdRing(vec2 p, float r1, float r2) {
  return abs(length(p) - r1) - r2;
}
float getDistance(vec2 uv) {
  switch (uShape) {
    case 0:
      return sdCustom(uv);
      break;
    case 1:
      return sdCircle(uv, 0.4);
      break;
    case 2:
      return sdSquare(uv, 0.4);
      break;
    case 3:
      return sdEquilateralTriangle(uv, 0.4);
      break;
    case 4:
      return sdStar5(uv, 0.4, 0.5);
      break;
    case 5:
      return sdDiamond(uv, 0.4);
      break;
    case 6:
      return sdPentagon(uv, 0.4);
      break;
    case 7:
      return sdHexagon(uv, 0.4);
      break;
    case 8:
      return sdOctagon(uv, 0.4);
      break;
    case 9:
      return sdVesica(uv, 0.5);
      break;
    case 10:
      return sdArchway(uv, 0.3);
      break;
    case 11:
      return sdX(uv, 0.4);
      break;
    case 12:
      return sdRing(uv, 0.3, 0.1);
      break;
    case 13:
      return sdBox(vTextureCoord - 0.5, vec2(0.5));
      break;
    default:
      return 1.0;
  }

}
float getDist(vec2 uv) {
  float sd = getDistance(uv);
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 mousePos = uMousePos * aspect;
  float mouseDistance = length(vTextureCoord * aspect - mousePos);
  float falloff = smoothstep(0.0, 0.8, mouseDistance);
  float asd = 2.0;

  // #ifelseopen

  if (uShape == 0) {
    asd = 0.5;
  }
  // #ifelseclose

  asd = uMouseDistortDir == 0 ? -asd : asd;
  float md = mix(0.02 / falloff, 0.1 / falloff, -asd * sd);
  md = md * 1.5 * uMouseDistort;
  md = uMouseDistortDir == 0 ? min(-md, 0.0) : max(md, 0.0);
  sd -= md;
  return sd;
}
float screenPxRange() {
  vec2 unitRange = vec2(0.5);
  vec2 screenTexSize = vec2(1.0) / fwidth(vTextureCoord);
  return max(0.5 * dot(unitRange, screenTexSize), 1.0);
}
vec4 refrakt(float sd, vec2 st, vec4 bg) {
  // #ifelseopen
  if (uInvert == 1) {
    sd = -sd;
  }
  // #ifelseclose

  vec2 offset = mix(vec2(0), normalize(st) / sd, length(st));

  // #ifelseopen

  if (uShape == 0) {
    offset *= 3.0;
  }
  // #ifelseclose

  vec4 r = vec4(0, 0, 0, 1);
  float rdisp = mix(0.01, 0.008, uDispersion);
  float gdisp = mix(0.01, 0.01, uDispersion);
  float bdisp = mix(0.01, 0.012, uDispersion);
  r.r = texture(uTexture, vTextureCoord + offset * (uRefraction - 0.5) * rdisp).r;
  r.g = texture(uTexture, vTextureCoord + offset * (uRefraction - 0.5) * gdisp).g;
  r.b = texture(uTexture, vTextureCoord + offset * (uRefraction - 0.5) * bdisp).b;
  float opacity = ceil(-sd);
  float smoothness = uShape == 0 ? 0.005 : 0.0025;
  opacity = smoothstep(0.0, smoothness, -sd);
  vec4 background = uShowBg == 0 ? vec4(0) : bg;
  return mix(background, r + vec4(uColor / (-sd * 50.0), 1.0) * uMix, opacity);
}
vec4 getEffect(vec2 st, vec4 bg) {
  float eps = 0.0005;
  float sd = getDist(st);
  float sd1 = getDist(st + vec2(eps, 0.0));
  float sd2 = getDist(st - vec2(eps, 0.0));
  float sd3 = getDist(st + vec2(0.0, eps));
  float sd4 = getDist(st - vec2(0.0, eps));
  vec4 r = refrakt(sd, st, bg);
  vec4 r1 = refrakt(sd1, st + vec2(eps, 0.0), bg);
  vec4 r2 = refrakt(sd2, st - vec2(eps, 0.0), bg);
  vec4 r3 = refrakt(sd3, st + vec2(0.0, eps), bg);
  vec4 r4 = refrakt(sd4, st - vec2(0.0, eps), bg);
  r = (r + r1 + r2 + r3 + r4) * 0.2;
  return r;
}
void main() {
  vec2 uv = vTextureCoord;
  vec4 bg = texture(uTexture, uv);
  vec4 color = vec4(1);
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 mousePos = mix(vec2(0), uMousePos - 0.5, uTrackMouse);
  vec2 st = uv - (uPos + mousePos);
  st *= aspect;
  st *= 1.0 / (uScale + 0.2);
  st *= rot(uAngle * 2.0 * PI);
  color = getEffect(st, bg);

  // #ifelseopen

  if (uBlendMode > 0) {
    color.rgb = blend(uBlendMode, bg.rgb, color.rgb);
  }
  // #ifelseclose

  // #ifelseopen
  if (uIsMask == 1) {
    vec2 maskPos = mix(vec2(0), uMousePos - 0.5, uParentTrackMouse);
    vec4 maskColor = texture(uMaskTexture, vTextureCoord - maskPos);
    color = color * (maskColor.a * maskColor.a);
  }
  // #ifelseclose

  fragColor = color;
}
