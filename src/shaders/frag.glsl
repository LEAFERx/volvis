precision highp sampler2D;
precision highp sampler3D;

// The ray start position, in ray space
varying vec3 frontPos;
// The world camera position, in ray space
varying vec3 cameraPos;
// The inverse view matrix for reconstruct coordinates in world space
varying mat4 inverseViewMatrix;

// The dimension of the volume data
uniform vec3 dimension;
// The interval of voxels
uniform vec3 voxelInterval;
// The texture storing 3d volume data
uniform sampler3D volumeData;
// Transfer function textures
uniform sampler2D tfR;
uniform sampler2D tfG;
uniform sampler2D tfB;
uniform sampler2D tfA;

// How many sample should we take along the view ray
uniform int raySampleNum;
// How many ray samples should we do per light sample
uniform int raySamplesPerLightSample;
// How many sample should we take along the light ray
uniform int lightSampleNum;

#if NUM_POINT_LIGHTS > 0
struct PointLight {
  vec3 position;
  vec3 color;
  float decay;
  float distance;
};

uniform PointLight pointLights[NUM_POINT_LIGHTS];
#endif

// User-defined intensity correction based on transfer function
float intensityCorrection(float intensity) {
  vec2 uv = vec2(intensity, 0.5);
  return texture2D(tfA, uv).r;
}

// User-defined intensity to color mapping based on transfer function
vec3 intensityToColor(float intensity){
  vec2 uv = vec2(intensity, 0.5);
  return vec3(texture2D(tfR, uv).r, texture2D(tfG, uv).r, texture2D(tfB, uv).r);
}

// Calculates the raycast end position from point in dir
vec3 RayCastEndPos(vec3 point, vec3 dir) {
	const vec3 boxMin = vec3(0.0);
	const vec3 boxMax = vec3(1.0);
	vec3 inv_dir = 1.0 / dir;
	vec3 tmin_tmp = (boxMin - point) * inv_dir;
	vec3 tmax_tmp = (boxMax - point) * inv_dir;

  // min/max on each dimension
	vec3 tmin = min(tmin_tmp, tmax_tmp);
	vec3 tmax = max(tmin_tmp, tmax_tmp);
  
	float t0 = max(tmin.x, max(tmin.y, tmin.z));
	float t1 = min(tmax.x, min(tmax.y, tmax.z));
  if (t0 > t1) {
    return vec3(0, 1, -1.0);
  }
  return point + dir * t1;
}

void main() {
  // Calculate the end of the ray
  vec3 backPos = RayCastEndPos(cameraPos, normalize(frontPos - cameraPos));
  
// #if NUM_POINT_LIGHTS > 0
//   vec3 testRay = RayCastEndPos(vec3(0.5), normalize((inverseViewMatrix * vec4(pointLights[0].position, 1.0)).xyz));
//   if (length(frontPos - testRay) <= 0.02){
//     gl_FragColor = vec4(1, 0, 0, 0);
//     return;
//   }
// #endif

  // Error handling
  if (backPos.z == -1.0){
    gl_FragColor = vec4(backPos + vec3(0, 0, 1), 1.0);
    return;
  }

  vec3 rayVec = backPos - frontPos;
  // Ray direction
  vec3 dir = normalize(rayVec);
  // Ray max length
  float maxLen = length(rayVec);

  // Current sample position
  vec3 currPos = frontPos;
  // Current smaple length
  float currLen = 0.0;
  // Accumulated alpha
  float alpha = 0.0;
  // Accumulated color
  vec3 accumulatedColor = vec3(0.0);

  // parameters
  float stepLen = 1.0 / float(raySampleNum);

#if NUM_POINT_LIGHTS > 0
  int sampleTimes = 0;
  float lastTransmittance = 0.0;
#endif

  while (currLen < maxLen) {
    // Real position in voxel
    vec3 realPos = currPos;
    realPos.y = 1.0 - realPos.y;  // vertically invert
    realPos.y *= (dimension.x / dimension.y);
    realPos.z *= (dimension.x / dimension.z);
    
    // Sample volume data to get voxel intensity
    float intensity = texture(volumeData, realPos).r / 255.0;
    // Get color mapping
    vec3 color = intensityToColor(intensity);
    // Do intensity correction
    intensity *= intensityCorrection(intensity);

#if NUM_POINT_LIGHTS > 0
    if (sampleTimes % raySamplesPerLightSample == 0) {
      vec3 lightAccumulatedColor = vec3(0.0);
      float lightStepLen = 1.0 / float(lightSampleNum);

      float totalTransmittance = 0.0;
      for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
        vec3 lightPosition = (inverseViewMatrix * vec4(pointLights[i].position, 1.0)).xyz;
        vec3 lightRayEndPos = RayCastEndPos(currPos, normalize(lightPosition - currPos + vec3(0.5)));
        
        // for potential errors
        if (lightRayEndPos.z == -1.0) {
          gl_FragColor = vec4(lightRayEndPos + vec3(0, 0, 1), 1.0);
          return;
        }

        vec3 lightDir = normalize(lightRayEndPos - currPos);
        float lightMaxLen = length(lightRayEndPos - currPos);
        float lightAccumulatedAlpha = 0.0;
        float transmittance = 1.0;

        // We do not take the current voxel into account.
        vec3 lightCurrPos = currPos + lightDir * lightStepLen;
        float lightCurrLen = lightStepLen;
        float lightAlphaParam = 1.0;

        for (int stp = 0; stp < lightSampleNum; stp++){
          vec3 lightTempPos = lightCurrPos;
          lightTempPos.y = 1.0 - lightTempPos.y;  // vertically invert
          lightTempPos.y *= (dimension.x / dimension.y);
          lightTempPos.z *= (dimension.x / dimension.z);

          float lightIntensity = texture(volumeData, lightTempPos).r / 255.0;
          lightIntensity *= lightAlphaParam;
          
          // lightAccumulatedColor += pointLights[i].color * lightIntensity * (1.0 - lightAccumulatedAlpha) * lightIntensity;

          lightAccumulatedAlpha += lightIntensity * (1.0 - lightAccumulatedAlpha);
          transmittance *= exp(-100.0 * lightIntensity * lightStepLen);

          if (lightAccumulatedAlpha >= 1.0 || lightCurrLen > lightMaxLen){
            break;
          }
          lightCurrLen += lightStepLen;
          lightCurrPos += lightDir * lightStepLen;
        }
        totalTransmittance += transmittance;
        // lightAccumulatedColor *= (lightAccumulatedAlpha) * pointLights[i].color;
      }
      lastTransmittance = totalTransmittance;
      // accumulatedColor += vec4(lightAccumulatedColor * 0.5, 0.5);
      accumulatedColor += totalTransmittance * color * (1.0 - alpha) * intensity;
    } else {
      accumulatedColor += lastTransmittance * color * (1.0 - alpha) * intensity;
    }
#else
    accumulatedColor += color * (1.0 - alpha) * intensity;
#endif

    // Accumulate alpha
    alpha += intensity * (1.0 - alpha);
    // If alpha >= 1.0, ray is totally absorbed, stop
    if (alpha >= 1.0){
      alpha = 1.0;
      break;
    }
    // Move to next sample
    currLen += stepLen;
    currPos += dir * stepLen;
  }

  gl_FragColor = vec4(accumulatedColor, 1.0);
} 