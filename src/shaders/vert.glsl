varying vec3 pos;
varying vec4 projected_pos;
uniform sampler2D tex, cubeTex, transferTex;
uniform float steps;
uniform float alphaCorrection;

const int MAX_STEPS = 887;

void main() {
  pos = position + vec3(0.5,0.5,0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
vec4 FlattenSample3DTexture(vec3 texCoord)
{
  vec4 colorSlice_1, colorSlice_2;
  vec2 texCoordSlice_1, texCoordSlice_2;
  float zSliceNum_1 = floor(texCoord.z * 255.0);
  float zSliceNum_2 = min(zSliceNum_1 + 1.0, 255.0);

  texCoord.xy /= 16.0;

  texCoordSlice_1 = texCoord.xy;
  texCoordSlice_2 = texCoord.xy;

  texCoordSlice_1.x += (mod(zSliceNum_1, 16.0) / 16.0);
  texCoordSlice_1.y += floor((255.0 - zSliceNum_1) / 16.0) / 16.0;
  texCoordSlice_2.x += (mod(zSliceNum_2, 16.0) / 16.0);
  texCoordSlice_2.y += floor((255.0 - zSliceNum_2) / 16.0) / 16.0;

  colorSlice_1 = texture2D(cubeTex, texCoordSlice_1);
  colorSlice_2 = texture2D(cubeTex, texCoordSlice_2);

  colorSlice_1.rgb = texture2D(transferTex, vec2(colorSlice_1.a, 1.0)).rgb;
  colorSlice_2.rgb = texture2D(transferTex, vec2(colorSlice_2.a, 1.0)).rgb;

  float zDifference = mod(texCoord.z * 255.0, 1.0);
  return mix(colorSlice_1, colorSlice_2, zDifference);
}


//Maybe this should be moved to frag.glsl??
void RayMarching(vec3 backPos) 
{
  // The front position is the world space position of the second render pass
  vec3 frontPos = pos;
  if((backPos.x == 0.0) && (backPos.y == 0.0))
  {
    gl_FragColor = vec4(0.0);
    return;
  }

  // The direction from the front position to back position
  vec3 dir = backPos - frontPos;
  float rayLength = length(dir);

  float delta = 1.0 / steps;
  vec3 deltaDirection = normalize(dir) * delta;
  float deltaDirectionLength = length(deltaDirection);

  //Start the ray casting from the front position
  vec3 currentPosition = frontPos;
  vec4 accumulatedColor = vec4(0.0);
  float accumulatedAlpha = 0.0;
  float accumulatedLength = 0.0;
  
  // It is said that this is a good factor?
  float alphaScaleFactor = 25.6 * delta;

  vec4 colorSample;
  float alphaSample;

  for (int i = 0;  i < MAX_STEPS; i++)
  {
    // colorSample = sampler3D(SOME_KIND_OF_SAMPLER, currentPosition) ???????????????
    alphaSample = colorSample.a * alphaCorrection;
    alphaSample *= (1.0 - accumulatedAlpha);
    alphaSample *= alphaScaleFactor;
    accumulatedColor += colorSample * alphaSample;
    accumulatedAlpha += alphaSample;

    currentPosition += deltaDirection;
    accumulatedLength += deltaDirectionLength;

    if(accumulatedLength >= rayLength || accumulatedAlpha >= 1.0)
    {
      break;
    }
  }
  gl_FragColor = accumulatedColor;
}