import './style.css';import './pairing.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {resection,prepareResection} from './resection';
const $=(id:string)=>document.getElementById(id)!;
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(36,1,.001,10);
camera.position.set(.32,.16,.38);
const renderer=new THREE.WebGLRenderer({canvas:$('scene') as HTMLCanvasElement,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.localClippingEnabled=true;
const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const studio=pmrem.fromScene(room,.04);scene.environment=studio.texture;room.dispose();pmrem.dispose();
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
scene.add(new THREE.HemisphereLight(0xc0e4f5,0x394136,2.2));
const light=new THREE.DirectionalLight(0xfff2d8,3);light.position.set(1,2,3);scene.add(light);
const back=new THREE.DirectionalLight(0x75c8db,2);back.position.set(-2,1,-1);scene.add(back);
const lighting=document.createElement('details');lighting.innerHTML='<summary>Luz y acabado</summary>';document.querySelector('aside')!.append(lighting);
function rangeControl(parent:HTMLElement,label:string,min:number,max:number,step:number,value:number,change:(v:number)=>void){const row=document.createElement('label');const caption=document.createElement('span');const input=document.createElement('input');input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);const update=()=>{caption.textContent=`${label}: ${input.value}`;change(Number(input.value));};input.oninput=update;caption.textContent=`${label}: ${value}`;row.append(caption,input);parent.append(row);return input;}
rangeControl(lighting,'Exposición',.2,2.5,.05,1,v=>{renderer.toneMappingExposure=v;});renderer.toneMapping=THREE.ACESFilmicToneMapping;
rangeControl(lighting,'Luz principal',0,8,.1,3,v=>light.intensity=v);
rangeControl(lighting,'Luz de relleno',0,6,.1,2,v=>back.intensity=v);
const hemi=scene.children.find(o=>o instanceof THREE.HemisphereLight) as THREE.HemisphereLight;
rangeControl(lighting,'Luz ambiental',0,5,.1,2.2,v=>hemi.intensity=v);
rangeControl(lighting,'Dirección de luz (°)',-180,180,1,18,v=>{const a=THREE.MathUtils.degToRad(v);light.position.set(3*Math.sin(a),2,3*Math.cos(a));});
rangeControl(lighting,'Altura de luz',-3,5,.1,2,v=>light.position.y=v);
const plane=new THREE.Plane(new THREE.Vector3(0,1,0),.3);
let anatomy:THREE.Group, mats:THREE.MeshStandardMaterial[]=[];
const implant=new THREE.Group();implant.visible=false;scene.add(implant);
const params={x:0,y:0,z:0,rx:0,ry:0,rz:0,headHeight:10,stemLength:40,headDiameter:24,stemDiameter:9};
let metalRoughness=.17;
const warning=document.querySelector('.warning');if(warning)warning.textContent='Vista educativa: fragmentos ocultos con implante. Recorte limitado al radio segmentado de forma aproximada; requiere revisión.';
document.querySelectorAll('.note').forEach(e=>{if(e.textContent?.includes('Posición inicial sin alinear.'))e.textContent=e.textContent.replace('Posición inicial sin alinear.','Alineamiento manual del usuario; pendiente de validación.');});
function buildImplant(){while(implant.children.length){const c=implant.children.pop() as THREE.Mesh;c.geometry.dispose();(c.material as THREE.Material).dispose();}const mat=new THREE.MeshPhysicalMaterial({color:0xdde3e8,metalness:1,roughness:metalRoughness,clearcoat:1,clearcoatRoughness:.1,envMapIntensity:1.6});const head=new THREE.Mesh(new THREE.CylinderGeometry(params.headDiameter/2000,params.headDiameter/2000,params.headHeight/1000,48),mat);implant.add(head);const stem=new THREE.Mesh(new THREE.CylinderGeometry(params.stemDiameter/2000,params.stemDiameter/2000,params.stemLength/1000,32),mat.clone());stem.position.y=-(params.headHeight+params.stemLength)/2000;implant.add(stem);}
function transform(){implant.position.set(params.x/1000,params.y/1000,params.z/1000);implant.rotation.set(...[params.rx,params.ry,params.rz].map(THREE.MathUtils.degToRad) as [number,number,number]);}
buildImplant();transform();
for(const [key,label,min,max] of [['headDiameter','Diámetro cabeza (mm)',12,40],['stemDiameter','Diámetro vástago (mm)',4,16]] as const){const row=document.createElement('label');row.textContent=label;const input=document.createElement('input');input.type='number';input.min=String(min);input.max=String(max);input.step='.5';input.value=String(params[key]);input.id=key;input.onchange=()=>{const v=Number(input.value);if(!Number.isFinite(v)||v<min||v>max){input.value=String(params[key]);return;}params[key]=v;buildImplant();};row.append(input);$('transform').before(row);}
rangeControl(lighting,'Rugosidad del metal',.03,.7,.01,.17,v=>{metalRoughness=v;implant.traverse(o=>{if(o instanceof THREE.Mesh)(o.material as THREE.MeshPhysicalMaterial).roughness=v;});});
const alignmentReady=fetch('./models/alignment.json').then(r=>{if(!r.ok)throw Error('No saved alignment');return r.json();}).then(d=>{for(const k of Object.keys(params) as (keyof typeof params)[]){if(d.parameters?.[k]===undefined)continue;if(!Number.isFinite(d.parameters[k]))throw Error('Invalid alignment');params[k]=d.parameters[k];}for(const k of ['x','y','z','rx','ry','rz'] as const)($(`t-${k}`) as HTMLInputElement).value=String(params[k]);($('head-height') as HTMLInputElement).value=String(params.headHeight);($('stem-length') as HTMLInputElement).value=String(params.stemLength);(['headDiameter','stemDiameter'] as const).forEach(k=>($(k) as HTMLInputElement).value=String(params[k]));buildImplant();transform();$('message').textContent='Tu alineamiento está cargado. Activa «Con implante» para verlo.';}).catch(()=>{});
for(const key of ['x','y','z','rx','ry','rz'] as const){const label=document.createElement('label');label.textContent=`${key.toUpperCase()} · ${key.startsWith('r')?'grados':'mm'}`;const input=document.createElement('input');input.type='range';input.min=key.startsWith('r')?'-180':'-150';input.max=key.startsWith('r')?'180':'150';input.step='0.5';input.value='0';input.id=`t-${key}`;input.oninput=()=>{params[key]=Number(input.value);transform()};label.append(input);$('transform').append(label);}
for(const [id,key] of [['head-height','headHeight'],['stem-length','stemLength']] as const){$(id).onchange=()=>{const value=Number(($(id) as HTMLInputElement).value);if(!Number.isFinite(value)||value<=0)return;params[key]=value;buildImplant();transform();};}
function state(after:boolean){implant.visible=after;resection.enabled.value=after;anatomy?.traverse(o=>{if(o instanceof THREE.Mesh&&o.name.startsWith('fragment_'))o.visible=!after;});$('after').classList.toggle('selected',after);$('before').classList.toggle('selected',!after);$('message').textContent=after?'Fragmentos ocultos y recorte exclusivo del radio segmentado. Segmentación aproximada.':'Anatomía original restaurada.';}
$('before').onclick=()=>state(false);$('after').onclick=()=>state(true);
$('opacity').oninput=()=>{for(const m of mats){m.opacity=Number(($('opacity') as HTMLInputElement).value);m.transparent=m.opacity<1;m.depthWrite=m.opacity===1;}};
$('clip').oninput=()=>{plane.constant=Number(($('clip') as HTMLInputElement).value)*.16;};
function reset(){camera.position.set(.32,.16,.38);controls.target.set(0,0,0);controls.update()}
$('reset').onclick=reset;document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.onclick=()=>{camera.position.set(...(b.dataset.view==='front'?[0,0,.5]:[.5,0,0]) as [number,number,number]);controls.target.set(0,0,0);controls.update();});
function download(name:string,data:unknown){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('save').onclick=()=>{implant.updateMatrix();download('alignment.json',{case_id:'case-001',geometry_status:'synthetic_approximation',alignment_status:'manual_unverified',units:'metres',head_diameter_mm:params.headDiameter,stem_diameter_mm:params.stemDiameter,parameters:params,matrix_column_major:implant.matrix.toArray()});};
$('load').onchange=async()=>{try{const file=($('load') as HTMLInputElement).files?.[0];if(!file)return;const d=JSON.parse(await file.text());for(const k of Object.keys(params) as (keyof typeof params)[]){if(d.parameters?.[k]===undefined)continue;if(!Number.isFinite(d.parameters[k]))throw Error('Parámetros inválidos');params[k]=d.parameters[k];}for(const k of ['x','y','z','rx','ry','rz'] as const)($(`t-${k}`) as HTMLInputElement).value=String(params[k]);buildImplant();transform();state(true);$('message').textContent='Alineación restaurada; requiere revisión.';}catch{$('message').textContent='No se pudo leer la alineación.';}};
// Primer prototipo de emparejamiento visual con la foto del brazo derecho.
const pairing=document.createElement('details');pairing.id='pairing';pairing.innerHTML='<summary>Emparejar con brazo real</summary><p class="note">Foto local corregida de espejo · ajuste visual aproximado.</p>';
function pairControl(label:string,id:string,min:string,max:string,step:string,value:string,apply:(v:number)=>void){const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.id=id;i.type='range';i.min=min;i.max=max;i.step=step;i.value=value;i.oninput=()=>apply(Number(i.value));l.append(i);pairing.append(l);return i;}
pairControl('Opacidad de foto','photo-opacity','0','1','.05','.55',v=>{armImage.style.opacity=String(v);});
pairControl('Escala','photo-scale','.5','2','.01','1',v=>{armImage.dataset.scale=String(v);updatePair();});
pairControl('Desplazamiento horizontal','photo-x','-50','50','1','0',v=>{armImage.dataset.x=String(v);updatePair();});
pairControl('Desplazamiento vertical','photo-y','-50','50','1','0',v=>{armImage.dataset.y=String(v);updatePair();});
pairControl('Rotación','photo-rotation','-30','30','.5','0',v=>{armImage.dataset.rotation=String(v);updatePair();});
function updatePair(){const s=Number(armImage.dataset.scale||1),x=Number(armImage.dataset.x||0),y=Number(armImage.dataset.y||0),r=Number(armImage.dataset.rotation||0);armImage.style.transform=`translate(calc(-50% + ${x}%),calc(-50% + ${y}%)) scaleX(-1) scale(${s}) rotate(${r}deg)`;}
const pairReset=document.createElement('button');pairReset.textContent='Restablecer emparejamiento';pairReset.onclick=()=>{for(const [id,v] of [['photo-opacity','0.55'],['photo-scale','1'],['photo-x','0'],['photo-y','0'],['photo-rotation','0']]){const i=$(id) as HTMLInputElement;i.value=v;i.dispatchEvent(new Event('input'));}};pairing.append(pairReset);document.querySelector('aside')!.insertBefore(pairing,$('camera'));
updatePair();
let stream:MediaStream|undefined;let tracking=false;let trackingFrame=0;
const trackingButton=document.createElement('button');trackingButton.textContent='Reconocer tatuaje (experimental)';trackingButton.style.width='100%';trackingButton.style.margin='4px 0';document.querySelector('aside')!.insertBefore(trackingButton,$('camera'));
const trackingCanvas=document.createElement('canvas');trackingCanvas.width=96;trackingCanvas.height=64;const trackingCtx=trackingCanvas.getContext('2d',{willReadFrequently:true})!;
function trackTattoo(){if(!tracking)return;const video=document.querySelector('video') as HTMLVideoElement|null;if(video&&video.readyState>=2){trackingCtx.drawImage(video,0,0,96,64);const px=trackingCtx.getImageData(0,0,96,64).data;let sx=0,sy=0,n=0;for(let y=8;y<56;y+=2)for(let x=8;x<88;x+=2){const i=(y*96+x)*4,l=(px[i]+px[i+1]+px[i+2])/3;if(l<85&&Math.max(px[i],px[i+1],px[i+2])-Math.min(px[i],px[i+1],px[i+2])<55){sx+=x;sy+=y;n++;}}if(n>18){const dx=(sx/n-48)/48,dy=(sy/n-32)/32;const canvas=$('scene') as HTMLCanvasElement;canvas.style.transform='translate('+(dx*7)+'%,'+(dy*7)+'%)';$('message').textContent='Tatuaje detectado de forma aproximada. Ajusta manualmente si es necesario.';}}trackingFrame=requestAnimationFrame(trackTattoo);}
trackingButton.onclick=()=>{tracking=!tracking;trackingButton.textContent=tracking?'Detener reconocimiento':'Reconocer tatuaje (experimental)';if(tracking)trackTattoo();else{cancelAnimationFrame(trackingFrame);($('scene') as HTMLCanvasElement).style.transform='';$('message').textContent='Reconocimiento detenido. Puedes continuar con el ajuste manual.';}};
$('camera').onclick=async()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=undefined;document.querySelector('video')?.remove();$('stage').classList.remove('camera-on');$('camera').textContent='Overlay de cámara experimental';return;}try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});const video=document.createElement('video');video.autoplay=true;video.muted=true;video.playsInline=true;video.srcObject=stream;$('stage').prepend(video);$('stage').classList.add('camera-on');$('camera').textContent='Cerrar cámara';$('message').textContent='Overlay manual. No detecta el tatuaje ni sigue el brazo. Usa rotación y zoom para ajustar.';}catch{$('message').textContent='Cámara no disponible. El visor 3D sigue funcionando.';}};
$('clear').onclick=async()=>{for(const k of await caches.keys())await caches.delete(k);localStorage.clear();$('message').textContent='Caché local borrada. Los DICOM originales no se modificaron.';};
new ResizeObserver(()=>{const r=$('stage').getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}).observe($('stage'));
let smooth=true,loadingModel=false;
const surfaceButton=document.createElement('button');surfaceButton.textContent='Superficie: suave · Ver detallada';surfaceButton.style.marginTop='14px';$('opacity').parentElement!.before(surfaceButton);
function loadSurface(){if(loadingModel)return;loadingModel=true;surfaceButton.disabled=true;new GLTFLoader().load(smooth?'./models/anatomy-smooth-segmented.glb':'./models/anatomy-segmented.glb',g=>{if(anatomy){scene.remove(anatomy);anatomy.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});}mats=[];anatomy=g.scene;anatomy.traverse(o=>{if(o instanceof THREE.Mesh){const opacity=Number(($('opacity') as HTMLInputElement).value);const m=new THREE.MeshStandardMaterial({color:0xe0d0ad,roughness:.8,side:THREE.DoubleSide,clippingPlanes:[plane],opacity,transparent:opacity<1,depthWrite:opacity===1});prepareResection(m,o.name.startsWith('radius_')?'radius':undefined);o.geometry.computeVertexNormals();o.material=m;mats.push(m);if(o.name.startsWith('fragment_'))o.visible=!implant.visible;}});scene.add(anatomy);$('status').textContent=smooth?'Acabado suavizado para visualización · 615 cortes':'Superficie detallada · Pendiente de revisión';surfaceButton.textContent=smooth?'Superficie: suave · Ver detallada':'Superficie: detallada · Ver suave';loadingModel=false;surfaceButton.disabled=false;},undefined,()=>{$('status').textContent='Error al cargar el modelo. Revisa la conexión local.';loadingModel=false;surfaceButton.disabled=false;});}
surfaceButton.onclick=()=>{smooth=!smooth;loadSurface();};loadSurface();
fetch('./models/manifest.json').then(r=>r.json()).then(m=>{$('metrics').innerHTML=`<div><span>Cortes únicos</span><b>${m.source_count}</b></div><div><span>Separación</span><b>0,35 mm</b></div><div><span>Espesor</span><b>0,60 mm</b></div><div><span>Etiquetas anatómicas</span><b>Pendientes</b></div><div><span>Implante alineado</span><b>No validado</b></div>`;});
renderer.setAnimationLoop(()=>{controls.update();implant.updateMatrixWorld();resection.inverse.value.copy(implant.matrixWorld).invert();resection.lower.value=-params.headHeight/2000;resection.upper.value=params.headHeight/2000;resection.radius.value=params.headDiameter/2000;renderer.render(scene,camera);});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));

// Local-only persistence; original DICOMs and approved meshes are never altered.
const settingsKey='atlas-approved-view-v1';
let settingsReady=false;
function captureView(){
  return {version:1,parameters:{...params},smooth,after:implant.visible,
    opacity:Number(($('opacity') as HTMLInputElement).value),
    clip:Number(($('clip') as HTMLInputElement).value),planeConstant:plane.constant,
    lighting:Array.from(lighting.querySelectorAll('input')).map(i=>Number(i.value)),
    lightPosition:light.position.toArray(),
    camera:{position:camera.position.toArray(),target:controls.target.toArray(),up:camera.up.toArray(),zoom:camera.zoom}};
}
function persistView(){if(!settingsReady)return;try{localStorage.setItem(settingsKey,JSON.stringify(captureView()));}catch{$('message').textContent='No se pudo guardar localmente. Usa Exportar vista completa.';}}
function restoreView(d:ReturnType<typeof captureView>){
  if(d.version!==1)throw Error('Versión de vista no compatible');
  Object.assign(params,d.parameters);
  for(const k of ['x','y','z','rx','ry','rz'] as const)($(`t-${k}`) as HTMLInputElement).value=String(params[k]);
  for(const [id,key] of [['head-height','headHeight'],['stem-length','stemLength'],['headDiameter','headDiameter'],['stemDiameter','stemDiameter']] as const)($(id) as HTMLInputElement).value=String(params[key]);
  lighting.querySelectorAll('input').forEach((input,i)=>{input.value=String(d.lighting[i]);input.dispatchEvent(new Event('input'));});
  light.position.fromArray(d.lightPosition);buildImplant();transform();
  ($('opacity') as HTMLInputElement).value=String(d.opacity);$('opacity').dispatchEvent(new Event('input'));
  ($('clip') as HTMLInputElement).value=String(d.clip);plane.constant=d.planeConstant;
  if(smooth!==d.smooth){smooth=d.smooth;if(loadingModel){const retry=window.setInterval(()=>{if(!loadingModel){clearInterval(retry);loadSurface();}},100);}else loadSurface();}
  state(d.after);
  if(d.camera){camera.position.fromArray(d.camera.position);camera.up.fromArray(d.camera.up);camera.zoom=d.camera.zoom;camera.updateProjectionMatrix();controls.target.fromArray(d.camera.target);controls.update();}
}
const savedPanel=document.createElement('details');savedPanel.innerHTML='<summary>Vista guardada</summary><p>Los ajustes y la cámara se guardan automáticamente en este navegador. El respaldo exportado permite recuperarlos en otro navegador.</p>';
const exportView=document.createElement('button');exportView.textContent='Exportar vista completa';exportView.onclick=()=>{persistView();download('atlas-vista-completa.json',captureView());};
const importView=document.createElement('input');importView.type='file';importView.accept='.json';importView.setAttribute('aria-label','Importar vista completa');importView.onchange=async()=>{try{const file=importView.files?.[0];if(!file)return;restoreView(JSON.parse(await file.text()));persistView();$('message').textContent='Vista completa restaurada.';}catch{$('message').textContent='No se pudo restaurar esta vista.';}};
savedPanel.append(exportView,importView);document.querySelector('aside')!.append(savedPanel);
alignmentReady.then(()=>{try{const saved=localStorage.getItem(settingsKey);if(saved)restoreView(JSON.parse(saved));}catch{$('message').textContent='Se conserva la versión aprobada; no se pudo recuperar la última vista.';}settingsReady=true;persistView();});
let saveTimer:number;
function scheduleSave(){clearTimeout(saveTimer);saveTimer=window.setTimeout(persistView,350);}
document.querySelector('aside')!.addEventListener('input',scheduleSave);
document.querySelector('aside')!.addEventListener('change',scheduleSave);
document.querySelector('aside')!.addEventListener('click',scheduleSave);
controls.addEventListener('change',scheduleSave);
window.addEventListener('pagehide',persistView);
