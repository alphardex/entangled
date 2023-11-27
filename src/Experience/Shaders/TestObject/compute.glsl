#include "/node_modules/lygia/generative/curl.glsl"
#include "/node_modules/lygia/generative/cnoise.glsl"
#include "/node_modules/lygia/sdf/boxSDF.glsl"
#include "/node_modules/lygia/space/rotate.glsl"
#include "/node_modules/lygia/math/map.glsl"

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

uniform sampler2D texturePosition;

uniform float uFreq;
uniform vec3 uAttract;
uniform float uNoise;
uniform float uId;
uniform bool uAttractEnabled;

vec3 fbm(vec3 p){
    vec3 value=p;
    float amplitude=.5;
    float frequency=2.;
    float lacunarity=2.;
    float persistance=.5;
    float scale=uNoise;
    int octaves=1;
    
    for(int i=0;i<octaves;i++){
        vec3 noiseVal=curl(value*frequency*scale);
        
        value+=amplitude*noiseVal;
        frequency*=lacunarity;
        amplitude*=persistance;
    }
    
    return value;
}

void main(){
    vec2 uv=gl_FragCoord.xy/resolution.xy;
    vec3 col=vec3(0.);
    
    vec3 pos=texture(texturePosition,uv).xyz;
    pos=curl(pos*uFreq);
    col=pos;
    vec3 pos2=texture(texturePosition,uv).xyz;
    pos2=curl(pos2*uFreq);
    pos2=fbm(pos2);
    col=pos2;
    float mixFactor=0.;
    mixFactor=cnoise(pos+iTime)*uNoise;
    col=mix(pos,pos2,mixFactor);
    
    col=rotate(col,iTime*.5,vec3(0.,1.,0.));
    
    if(uAttractEnabled){
        vec3 attract=uAttract;
        attract.x=uId==0.?map(attract.x,369.,1000.,0.,3.):map(attract.x,0.,480.,-3.,0.)*-1.;
        // attract.y=map(attract.y,369.,572.,-1.,1.);
        attract.y=0.;
        float attractX=abs(attract.x);
        if(attractX>0.){
            float d=boxSDF(col-attract,vec3(attractX,.25,.25));
            vec3 dir=normalize(col-attract);
            col-=dir*smoothstep(.2*pow(2.,uId),.0,d)*(attractX-1.);
        }
    }
    
    gl_FragColor=vec4(col,1.);
}