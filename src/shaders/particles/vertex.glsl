#include ../includes/simplexNoise2d.glsl



uniform float uTime;
uniform float uPositionFrequency;
uniform float uStrength;
uniform float uWarpFrequency;
uniform float uWarpStrength;

varying vec3 vPosition;
varying float vUpDot;


float getElevation(vec2 position){

    vec2 warpedPosition = position;
    warpedPosition += uTime * 0.05;
    warpedPosition += simplexNoise2d(warpedPosition * uPositionFrequency * uWarpFrequency) * uWarpStrength; 

    float elevation = 0.0; 
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency      ) / 2.0;
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 2.0) / 4.0;
    elevation += simplexNoise2d(warpedPosition * uPositionFrequency * 4.0) / 8.0;

    float elevationSign = sign(elevation);
    elevation = pow(abs(elevation), 2.0) * elevationSign * uStrength;

    return elevation;
}

void main(){

    //Neighbours position
    float shift = 0.01;
    vec3 positionA = position + vec3(shift, 0.0, 0.0);
    vec3 positionB = position + vec3(0.0, 0.0, -shift);

    //Elevation
    float elevation = getElevation(csm_Position.xz);
    csm_Position.y += elevation;  
    positionA.y = getElevation(positionA.xz);
    positionB.y = getElevation(positionB.xz);

    //Compute Normal
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB);

    //Varyings
    vPosition = csm_Position;
    vPosition.xz += uTime * 0.05;
    vUpDot = dot(csm_Normal, vec3(0.0, 1.0, 0.0));
}