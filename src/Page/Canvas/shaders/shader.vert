
attribute vec3  color;
attribute float size;

varying vec3 vColor;

uniform float uTime;
uniform vec2 uMouse;

void main() {
  vColor = color;

  // カメラ距離でポイントサイズを大小させる
  vec4 eyeCoord = modelViewMatrix * vec4( position, 1.0 );
  float dist = length( eyeCoord );
  float sizeScale = 600. / dist;

  gl_PointSize = size * sizeScale;

  gl_Position = projectionMatrix * eyeCoord;
}
