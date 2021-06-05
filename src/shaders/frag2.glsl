precision highp sampler2D;
precision highp sampler3D;

varying vec3 frontPos;
varying vec4 projectedCoords;
varying vec3 cameraPos;

uniform vec3 objectSize;
uniform vec3 stepSize;

uniform sampler3D rawObjectTexture;

#if NUM_POINT_LIGHTS > 0
struct PointLight {
  vec3 position;
  vec3 color;
  float decay;
  float distance;
};
uniform PointLight pointLights[NUM_POINT_LIGHTS];
#endif

// Stores the xyz position of backside by RGB values, access by projectedCoords
// uniform sampler2D backSideTexture;

vec4 MapToColor(float alpha){
  // Needs transfer function.
  return vec4(alpha + 0.3);
}

// Calculates the raycast end position from point in dir.
vec3 RayCastEndPos(vec3 point, vec3 dir) {
	const vec3 boxMin = vec3(0);
	const vec3 boxMax = vec3(1);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (boxMin - point) * inv_dir;
	vec3 tmax_tmp = (boxMax - point) * inv_dir;

  // min/max on each dimension
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
  
  // y = x + t*dir
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
  // if(t0 < 0.0){
  //   return vec3(1.0, 0, -1.0);
  // }
  if(t0 > t1){
    return vec3(0, 1, -1.0);
  }
  return point + dir * t1;
}
void main() {
  vec2 projectiveUV = vec2(((projectedCoords.x / projectedCoords.w) + 1.0) / 2.0, ((projectedCoords.y / projectedCoords.w) + 1.0) / 2.0 );
  // vec3 backPos = texture2D(backSideTexture, projectiveUV).xyz;
  vec3 backPos = RayCastEndPos(cameraPos, normalize(frontPos - cameraPos));
  
  vec3 testRay = RayCastEndPos(vec3(0.5, 0.5, 0.5), normalize(pointLights[0].position - vec3(0.5, 0.5, 0.5)));
  if(length(frontPos - testRay) <= 0.02){
    gl_FragColor = vec4(1, 0, 0, 0);
    return;
  }

  // Error handling
  if(backPos.z == -1.0){
    gl_FragColor = vec4(backPos + vec3(0, 0, 1), 0);
    return;
  }

  vec3 rayVec = backPos - frontPos;
  vec3 dir = normalize(rayVec);
  float maxLen = length(rayVec);

  vec3 currPos = frontPos;
  float currLen = 0.0;
  float alpha = 0.0;
  vec4 accumulatedColor = vec4(0.0);

  // parameters
  float alphaParam = 0.3;
  float stepLen = 1.0 / 256.0;
  const int MAX_STEPS = 256;

  while (currLen < maxLen) {
    vec3 tempPos = currPos;
    tempPos.y = 1.0 - tempPos.y;  // vertically invert
    tempPos.y *= (objectSize.x / objectSize.y);
    tempPos.z *= (objectSize.x / objectSize.z);

    float intensity = texture(rawObjectTexture, tempPos).r / 255.0;
    intensity *= alphaParam;

    vec3 lightAccumulatedColor = vec3(0.0);
#if NUM_POINT_LIGHTS > 0
    float lightStepLen = 1.0/64.0;
    const int LIGHT_MAX_STEPS = 64;

    float totalTransmittance = 0.0;
    for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
      vec3 lightRayEndPos = RayCastEndPos(currPos, normalize(pointLights[i].position - currPos));
      
      // for potential errors
      if(lightRayEndPos.z == -1.0){
        gl_FragColor = vec4(lightRayEndPos + vec3(0, 0, 1), 0);
        return;
      }

      vec3 lightDir = normalize(lightRayEndPos - currPos);
      float lightMaxLen = length(lightRayEndPos - currPos);
      float lightAccumulatedAlpha = 0.0;
      float transmittance = 1.0;

      // We do not take the current voxel into account.
      vec3 lightCurrPos = currPos + lightDir * lightStepLen;
      float lightCurrLen = lightStepLen;
      float lightAlphaParam = 0.1;

      for(int stp = 0; stp < LIGHT_MAX_STEPS; stp++){
        vec3 lightTempPos = lightCurrPos;
        lightTempPos.y = 1.0 - lightTempPos.y;  // vertically invert
        lightTempPos.y *= (objectSize.x / objectSize.y);
        lightTempPos.z *= (objectSize.x / objectSize.z);

        float lightIntensity = texture(rawObjectTexture, lightTempPos).r / 255.0;
        lightIntensity *= lightAlphaParam;
        
        // lightAccumulatedColor += pointLights[i].color * lightIntensity * (1.0 - lightAccumulatedAlpha) * lightIntensity;

        lightAccumulatedAlpha += lightIntensity * (1.0 - lightAccumulatedAlpha);
        transmittance *= exp(-100.0 * lightIntensity * lightStepLen);

        if(lightAccumulatedAlpha >= 1.0 || lightCurrLen > lightMaxLen){
          break;
        }
        lightCurrLen += lightStepLen;
        lightCurrPos += lightDir * lightStepLen;
      }
      totalTransmittance += transmittance;
      // lightAccumulatedColor *= (lightAccumulatedAlpha) * pointLights[i].color;
    }
    // accumulatedColor += vec4(lightAccumulatedColor * 0.5, 0.5);
    accumulatedColor += totalTransmittance * MapToColor(intensity) * (1.0 - alpha) * intensity;;
#else
    accumulatedColor += MapToColor(intensity) * (1.0 - alpha) * intensity;
#endif

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