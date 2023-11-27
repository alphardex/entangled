uniform float iTime;
uniform vec3 iResolution;
uniform vec4 iMouse;

varying vec2 vUv;

uniform float uPointSize;
uniform float uPixelRatio;

uniform sampler2D texturePosition;

attribute vec2 reference;
attribute float aOpacity;

varying float vOpacity;

void main(){
    vec3 p=texture(texturePosition,reference).xyz;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    
    vUv=uv;
    
    gl_PointSize=uPointSize*uPixelRatio;
    // vec4 mvPosition=modelViewMatrix*vec4(p,1.);
    // gl_PointSize*=(1./-mvPosition.z);
    
    vOpacity=aOpacity;
}