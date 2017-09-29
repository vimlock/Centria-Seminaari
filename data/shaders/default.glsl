
#ifdef COMPILE_FRAGMENT
    #define varying in
    
    precision mediump float;
#endif

#ifdef COMPILE_VERTEX
    #define varying out

    uniform mat4 iModelViewMatrix;
    uniform mat4 iProjectionMatrix;

    in vec3 iPosition;

    #ifdef VERTEX_COLORS
        in vec3 iColor;
        #endif

    #ifdef NORMALS
        in vec3 iNormal;
    #endif

    #if defined(DIFFUSEMAP || NORMALMAP)
        in vec2 vTexCoord;
    #endif

    #ifdef NORMALMAP
        in vec3 iTangent;
    #endif

#endif

#ifdef VERTEX_COLORS
    varying vec3 vColor;
#endif

#if defined(DIFFUSEMAP || NORMALMAP)
    varying vec2 vTexCoord;
#endif

#ifdef NORMALS
    varying vec3 vNormal;
#endif

#ifdef NORMALMAP
    varying vec3 vTangent;
#endif

///////////////////////////////////////////////////////////////////////////////
// Vertex shader

#ifdef COMPILE_VERTEX

void main()
{
    vec4 pos = iModelViewMatrix * iPosition;
    pos *= iProjectionMatrix;

    #ifdef VERTEX_COLORS
        vColor = iColor;
    #endif

    #if defined(DIFFUSEMAP || NORMALMAP)
        vTexCoord = iTexCoord;
    #endif

    gl_Position = pos;
}

#endif

#ifdef COMPILE_FRAGMENT

uniform sampler2D sDiffuse;
uniform sampler2D sSpecular;
uniform sampler2D sAmbient;
uniform sampler2D sNormalMap;
uniform sampler2D sHeightMap;
uniform sampler2D sEmission;
uniform sampler2D sEnvironment;

uniform vec4 fDiffuseColor;
uniform vec4 fSpecularColor;
uniform vec3 fEmission;

out vec4 fColor;

vec4 GetDiffuse()
{
    return vec4(1.0, 1.0, 1.0, 1.0);
}

vec3 GetSpecular()
{
    return vec3(0.1, 0.1, 0.1);
}

vec3 GetAmbient()
{
    return vec3(0.0, 0.0, 0.0);
}

vec3 GetEmission()
{
    return vec3(0.0, 0.0, 0.0);
}

///////////////////////////////////////////////////////////////////////////////
// Fragment shader

void main()
{
    vec4 col;

    #ifdef DIFFUSEMAP
        col = texture2D(sDiffuse, vTexCoord);
    #else
        col = vec4(1.0, 1.0, 1.0, 1.0);
    #endif

    #ifdef VERTEX_COLORS
        col *= vColor;
    #else
        col *= vec4(0.0, 1.0, 1.0, 1.0);
    #endif

    col *= GetDiffuse();
    col.rgb += GetSpecular();
    col.rgb += GetEmission();
    col.rgb += GetAmbient();

    fColor = col;
}

#endif
