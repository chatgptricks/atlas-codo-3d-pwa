import * as THREE from 'three';
export const resection={enabled:{value:false},inverse:{value:new THREE.Matrix4()},radius:{value:.012},lower:{value:-.007},upper:{value:.005}};
export function prepareResection(material:THREE.MeshStandardMaterial,anatomicalLabel?:string){
 // Never cut unsegmented anatomy or adjacent bones. Radius must be explicitly labelled.
 if(anatomicalLabel!=='radius')return;
 material.onBeforeCompile=shader=>{
  shader.uniforms.resectEnabled=resection.enabled;shader.uniforms.resectInverse=resection.inverse;shader.uniforms.resectRadius=resection.radius;shader.uniforms.resectLower=resection.lower;shader.uniforms.resectUpper=resection.upper;
  shader.vertexShader='varying vec3 resectWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nresectWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader='varying vec3 resectWorld; uniform bool resectEnabled; uniform mat4 resectInverse; uniform float resectRadius; uniform float resectLower; uniform float resectUpper;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(resectEnabled){vec3 q=(resectInverse*vec4(resectWorld,1.0)).xyz;if(q.y>resectLower)discard;}');
 };
 material.customProgramCacheKey=()=> 'radius-only-plane-resection-v2';
}
