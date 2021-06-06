// The ray start position, in ray space
varying vec3 frontPos;
// The world camera position, in ray space
varying vec3 cameraPos;
// The inverse view matrix for reconstruct coordinates in world space
varying mat4 inverseViewMatrix;

// The camera position in world space
uniform vec3 worldCoordCameraPos;


void main() {
  frontPos = (modelMatrix * vec4(position + vec3(0.5, 0.5, 0.5), 1.0)).xyz;
  cameraPos = worldCoordCameraPos + vec3(0.5, 0.5, 0.5);
  inverseViewMatrix = inverse(viewMatrix);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
