varying vec3 pos;
varying vec4 projected_pos;
uniform sampler2D tex, cubeTex, transferTex;
uniform float steps;
uniform float alphaCorrection;

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