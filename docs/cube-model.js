export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function amplitude(x,y,z){
  const fold=.11*Math.sin(x*2.4)+.075*Math.cos(z*3.1);
  const fault = x > .2 + .12 * y ? .13 : 0;
  const depth=y+fold+fault;
  return clamp(Math.sin(depth*34)*.7+Math.sin(depth*57+x*.5)*.2+Math.sin(x*13+z*11+y*27)*.06,-1,1);
}
export function planePoint(axis,position,u,v){
  const p=clamp(position,0,100)/100*2.6-1.3;
  const a=(u-.5)*2.6,b=(v-.5)*2.6;
  if(axis==='x')return [p,b,-a];
  if(axis==='y')return [a,p,-b];
  if(axis==='z')return [a,b,p];
  throw new TypeError('Unknown slice orientation');
}
export function texturePixels(axis,position,size=128){
  const pixels=new Uint8Array(size*size*4);
  for(let row=0;row<size;row++)for(let column=0;column<size;column++){
    const value=amplitude(...planePoint(axis,position,column/(size-1),row/(size-1)));
    const gray=Math.round(133+value*105),i=(row*size+column)*4;
    pixels[i]=clamp(gray+Math.max(value,0)*9,0,255);pixels[i+1]=gray;pixels[i+2]=clamp(gray-Math.max(value,0)*8,0,255);pixels[i+3]=255;
  }
  return pixels;
}
