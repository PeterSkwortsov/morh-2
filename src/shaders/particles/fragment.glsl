// #include ../includes/simplexNoise4d.glsl

varying vec3 vPosition;

uniform float uSliceArc;
uniform float uSliceStart;

void main()
{
    

    float angale = atan(vPosition.y, vPosition.x);
    angale -= uSliceStart;
    angale = mod(angale, PI2);

    if(angale > 0.0 && angale < uSliceArc)
    discard;

    float csm_Slice;
 
}