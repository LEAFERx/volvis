varying vec3 frontPos;
varying vec4 projectedCoords;

varying vec3 cameraPos;

uniform vec3 worldCoordCameraPos;

void main() {
  // // vertexShader first pass
  // pos = position + vec3(0.5,0.5,0.5);
  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  // vertexShader second pass
  frontPos = (modelMatrix * vec4(position + vec3(0.5, 0.5, 0.5), 1.0)).xyz;
  cameraPos = worldCoordCameraPos + vec3(0.5, 0.5, 0.5);


  gl_Position = projectionMatrix *  modelViewMatrix * vec4(position, 1.0);
  projectedCoords = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
