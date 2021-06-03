varying vec3 frontPos;
varying vec4 projectivePos;

uniform sampler3D rawObjectTexture;

// Stores the xyz position of backside by RGB values, access by projectivePos
uniform sampler2D backSideTexture;

vec3 MapToColor(float alpha){
  // Needs transfer function.
  return vec3(alpha, alpha, alpha);
}

void main(){
  vec2 projectiveUV;
  vec3 backPos = texture2D(backsideTexture, projectiveUV).xyz;

  vec3 rayVec = backPos - frontPos;
  vec3 dir = normalize(rayVec);
  float maxLen = length(rayVec);

  vec3 currPos = frontPos;
  float currLen = 0.0;
  float alpha = 0.0;
  vec4 accumulatedColor = vec4(0.0);

  // parameters
  float alphaParam = 1.0;
  float stepLen = 1.0/256;

  while(currLen < maxLen){
    float intensity = texture3D(rawObjectTexture, currPos);
    // may need to normalize intensity
    intensity *= alphaParam;

    accumulatedColor += MapToColor(intensity) * (1.0 - alpha) * intensity;

    alpha += intensity;
    if(alpha >= 1.0){
      alpha = 1.0;
      break;
    }
    currLen += stepLen;
    currPos += dir * stepLen;
  }
  gl_FragColor = accumulatedColor;
} 