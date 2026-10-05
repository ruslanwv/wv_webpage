import {clamp,texturePixels} from './cube-model.js';
const workspace=document.querySelector('.cube-workspace');
const canvas=document.querySelector('#cube-canvas');
const status=document.querySelector('#cube-status');
const fallback=document.querySelector('.cube-fallback');
const inputs=[...document.querySelectorAll('.cube-controls input,.cube-controls button')];
let started=false;
async function startCube(){
  if(started)return;started=true;
  workspace.setAttribute('aria-busy','true');inputs.forEach(input=>{input.disabled=true});
  try {
    const THREE=await import('./vendor/three.module.js');
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(40,1,.1,100);
    camera.position.set(4,3.2,4.8);camera.lookAt(0,0,0);
    const volume=new THREE.Group();scene.add(volume);
    const envelope=new THREE.Group();volume.add(envelope);
    const state={axis:'x',position:50,yaw:0,pitch:0,zoom:1};
    let queued=0,sliceDirty=false,visible=true;
    function requestRender(){if(!queued&&!document.hidden&&visible)queued=requestAnimationFrame(render)}
    function makeTexture(axis,position){
      const texture=new THREE.DataTexture(texturePixels(axis,position),128,128,THREE.RGBAFormat);
      texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
      return texture;
    }
    function orient(mesh,axis,coordinate){
      mesh.rotation.set(0,0,0);mesh.position.set(0,0,0);
      if(axis==='x'){mesh.rotation.y=Math.PI/2;mesh.position.x=coordinate}
      else if(axis==='y'){mesh.rotation.x=-Math.PI/2;mesh.position.y=coordinate}
      else mesh.position.z=coordinate;
    }
    const plane=new THREE.PlaneGeometry(2.6,2.6);
    for(const axis of ['x','y','z'])for(const position of [0,100]){
      const face=new THREE.Mesh(plane,new THREE.MeshBasicMaterial({map:makeTexture(axis,position),side:THREE.DoubleSide,transparent:true,opacity:.26,depthWrite:false}));
      orient(face,axis,position===0?-1.3:1.3);envelope.add(face);
    }
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6,2.6,2.6)),new THREE.LineBasicMaterial({color:0xf2a76a,transparent:true,opacity:.65}));volume.add(edges);
    const sliceTexture=makeTexture('x',50);
    const slice=new THREE.Mesh(plane,new THREE.MeshBasicMaterial({map:sliceTexture,side:THREE.DoubleSide}));volume.add(slice);orient(slice,'x',0);
    const sliceOutline=new THREE.LineSegments(new THREE.EdgesGeometry(plane),new THREE.LineBasicMaterial({color:0xffb36b}));slice.add(sliceOutline);

    const horizons=new THREE.Group();volume.add(horizons);
    for(const level of [-.65,-.1,.5]){
      const geometry=new THREE.PlaneGeometry(2.6,2.6,35,35),position=geometry.attributes.position;
      for(let i=0;i<position.count;i++){
        const x=position.getX(i),z=position.getY(i);
        position.setXYZ(i,x,level-.11*Math.sin(x*2.4)-.075*Math.cos(z*3.1)-(x > .2 ? .13 : 0),z);
      }
      position.needsUpdate=true;geometry.computeVertexNormals();
      horizons.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0xff9248,side:THREE.DoubleSide,transparent:true,opacity:.16,depthWrite:false})));
      for(const z of [-1.3,1.3]){
        const points=[];
        for(let i=0;i<=80;i++){const x=-1.3+i/80*2.6;points.push(new THREE.Vector3(x,level-.11*Math.sin(x*2.4)-.075*Math.cos(z*3.1)-(x > .2 ? .13 : 0),z))}
        horizons.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xffad72})));
      }
    }
    const fault=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshBasicMaterial({color:0xffc2a2,side:THREE.DoubleSide,transparent:true,opacity:.2,depthWrite:false}));
    fault.rotation.y=Math.PI/2;fault.rotation.z=.18;fault.position.x=.2;volume.add(fault);
    const wellCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.8,1.5,-.5),new THREE.Vector3(-.8,.6,-.5),new THREE.Vector3(-.6,-.2,-.4),new THREE.Vector3(.1,-.7,-.1),new THREE.Vector3(1,-.95,.35)]);
    const well=new THREE.Mesh(new THREE.TubeGeometry(wellCurve,70,.025,8,false),new THREE.MeshBasicMaterial({color:0xffeed0}));volume.add(well);
    function resize(){
      const width=canvas.clientWidth,height=canvas.clientHeight;
      if(!width||!height)return;
      renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();requestRender();
    }
    function render(){
      queued=0;if(document.hidden||!visible)return;
      if(sliceDirty){sliceTexture.image.data.set(texturePixels(state.axis,state.position));sliceTexture.needsUpdate=true;orient(slice,state.axis,state.position/100*2.6-1.3);sliceDirty=false}
      volume.rotation.set(state.pitch,state.yaw,0);volume.scale.setScalar(state.zoom);renderer.render(scene,camera);
    }
    function setSlice(){
      state.axis=document.querySelector('input[name="cube-axis"]:checked').value;
      state.position=Number(document.querySelector('#cube-slice').value);
      document.querySelector('#cube-slice-value').textContent=`${state.position}%`;
      document.querySelector('#cube-slice').setAttribute('aria-valuetext',`${state.axis==='x'?'Inline':state.axis==='y'?'Depth':'Crossline'} slice at ${state.position} percent`);
      sliceDirty=true;requestRender();
    }
    document.querySelectorAll('input[name="cube-axis"]').forEach(input=>input.addEventListener('change',setSlice));
    document.querySelector('#cube-slice').addEventListener('input',setSlice);
    for(const [selector,group] of [['#cube-horizons',horizons],['#cube-fault',fault],['#cube-well',well],['#cube-envelope',envelope]]){
      document.querySelector(selector).addEventListener('change',event=>{group.visible=event.target.checked;requestRender()});
    }
    function rotate(amount){state.yaw+=amount;requestRender()}
    function zoom(amount){state.zoom=clamp(state.zoom+amount,.65,1.6);requestRender()}
    document.querySelector('#cube-left').addEventListener('click',()=>rotate(-.25));
    document.querySelector('#cube-right').addEventListener('click',()=>rotate(.25));
    document.querySelector('#cube-zoom-in').addEventListener('click',()=>zoom(.12));
    document.querySelector('#cube-zoom-out').addEventListener('click',()=>zoom(-.12));
    document.querySelector('#cube-reset').addEventListener('click',()=>{
      state.yaw=0;state.pitch=0;state.zoom=1;state.axis='x';state.position=50;
      document.querySelector('input[name="cube-axis"][value="x"]').checked=true;document.querySelector('#cube-slice').value='50';
      for(const [selector,group] of [['#cube-horizons',horizons],['#cube-fault',fault],['#cube-well',well],['#cube-envelope',envelope]]){document.querySelector(selector).checked=true;group.visible=true}
      setSlice();
    });
    const pointers=new Map();let previousDistance=0;
    canvas.addEventListener('pointerdown',event=>{canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});previousDistance=0});
    canvas.addEventListener('pointermove',event=>{
      const old=pointers.get(event.pointerId);if(!old)return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(pointers.size===1){state.yaw+=(event.clientX-old.x)*.008;state.pitch=clamp(state.pitch+(event.clientY-old.y)*.006,-1.15,1.15)}
      else {
        const [a,b]=[...pointers.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);
        if(previousDistance)state.zoom=clamp(state.zoom+(distance-previousDistance)*.003,.65,1.6);
        previousDistance=distance;
      }
      requestRender();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,event=>{pointers.delete(event.pointerId);previousDistance=0}));
    canvas.addEventListener('wheel',event=>{if(document.activeElement!==canvas&&!event.ctrlKey)return;event.preventDefault();zoom(event.deltaY>0?-.06:.06)},{passive:false});
    canvas.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='ArrowLeft')rotate(-.15);else if(event.key==='ArrowRight')rotate(.15);
      else if(event.key==='ArrowUp'){state.pitch=clamp(state.pitch-.1,-1.15,1.15);requestRender()}
      else if(event.key==='ArrowDown'){state.pitch=clamp(state.pitch+.1,-1.15,1.15);requestRender()}
      else zoom(event.key==='-'?-.1:.1);
    });
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback.hidden=false;status.textContent='3D rendering was interrupted. Reload to restore the interactive view.';inputs.forEach(input=>{input.disabled=true})});
    if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
    if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestRender()}).observe(canvas);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestRender()});
    inputs.forEach(input=>{input.disabled=false});workspace.setAttribute('aria-busy','false');fallback.hidden=true;
    status.textContent='Interactive volume ready. Drag to rotate, or use the slice and layer controls.';
    resize();setSlice();
  }catch(error){
    workspace.setAttribute('aria-busy','false');status.textContent='The interactive 3D view is unavailable in this browser. The original product illustration is shown instead.';fallback.hidden=false;
  }
}
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();startCube()}},{rootMargin:'350px'});observer.observe(workspace);
}else startCube();
