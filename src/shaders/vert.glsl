varying vec3 pos;
varying vec4 projectedCoords;

void main() {
  // vertexShader first pass
  pos = position + vec3(0.5,0.5,0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  // //vertexShader second pass
  // pos = (modelMatrix * vec4(position + vec3(0.5,0.5,0.5), 1.0)).xyz;
  // gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
  // projectedCoords =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
