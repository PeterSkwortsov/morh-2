#include ../includes/simplexNoise4d.glsl
attribute vec4 tangent;

uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uStrength;

uniform float uWarpPositionFrequency;
uniform float uWarpTimeFrequency;
uniform float uWarpStrength;

varying float vWobble;


float getWoble(vec3 position)
{
    vec3 warpedPosition = position;
    warpedPosition += simplexNoise4d(vec4(
        position * uWarpPositionFrequency,
        uTime * uWarpTimeFrequency
    )) * uWarpStrength;


    return simplexNoise4d(vec4(
    warpedPosition * uPositionFrequency, // xyz
    uTime *  uTimeFrequency// time
    )) * uStrength;
}


void main()
{
vec3 biTangent = cross(normal, tangent.xyz);

// позиции соседей
float shift = 1.9;
vec3 positionA = csm_Position + tangent.xyz * shift;
vec3 positionB = csm_Position + biTangent * shift;

float wobble = getWoble(csm_Position);
csm_Position += wobble * normal;
positionA += getWoble(positionA) * normal;
positionB += getWoble(positionB) * normal;

vec3 toA = normalize(positionA - csm_Position);
vec3 toB = normalize(positionB - csm_Position);

csm_Normal = cross(toA, toB);

vWobble = vWobble / uStrength;

} 