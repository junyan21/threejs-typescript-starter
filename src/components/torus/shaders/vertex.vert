// Original source
// https://github.com/marioecg/github-universe-2020-tutorial/blob/main/src/shaders/vertex.glsl
varying vec2 vUv;
uniform float uTime;

void main() {
  vUv = uv;

  float time = uTime * 1.0;

  vec3 transformed = position;
  transformed.z += sin(position.y + time);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}