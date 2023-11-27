uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;

varying vec2 vUv;

uniform vec3 uColor;

varying float vOpacity;

void main(){
    vec2 uv=vUv;
    vec4 col=vec4(uColor,vOpacity);
    gl_FragColor=col;
}