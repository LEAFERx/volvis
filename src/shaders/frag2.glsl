precision highp sampler2D;
precision highp sampler3D;

varying vec3 frontPos;
varying vec4 projectedCoords;

uniform sampler3D rawObjectTexture;

// Stores the xyz position of backside by RGB values, access by projectedCoords
uniform sampler2D backSideTexture;

vec4 MapToColor(float alpha){
  // Needs transfer function.
  return vec4(alpha);
}

void main() {
  vec2 projectiveUV = vec2(((projectedCoords.x / projectedCoords.w) + 1.0) / 2.0, ((projectedCoords.y / projectedCoords.w) + 1.0) / 2.0 );
  vec3 backPos = texture2D(backSideTexture, projectiveUV).xyz;

  vec3 rayVec = backPos - frontPos;
  vec3 dir = normalize(rayVec);
  float maxLen = length(rayVec);

  vec3 currPos = frontPos;
  float currLen = 0.0;
  float alpha = 0.0;
  vec4 accumulatedColor = vec4(0.0);

  // parameters
  float alphaParam = 1.0;
  float stepLen = 1.0 / 512.0;

  while (currLen < maxLen) {
    float intensity = texture(rawObjectTexture, currPos).r / 255.0;
    // may need to normalize intensity
    intensity *= alphaParam;

    accumulatedColor += MapToColor(intensity) * (1.0 - alpha) * intensity;

    alpha += intensity * (1.0 - alpha);
    if (alpha >= 1.0){
      alpha = 1.0;
      break;
    }
    currLen += stepLen;
    currPos += dir * stepLen;
  }
  gl_FragColor = accumulatedColor;
} 