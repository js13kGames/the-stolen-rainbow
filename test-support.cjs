const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function sandbox(){
  const events={},elements={},storage=new Map();let raf;
  const context=new Proxy({}, {get(obj,key){
    if(key in obj)return obj[key];
    if(key==='createLinearGradient')return()=>({addColorStop(){}});
    return(...args)=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),'drawing '+key)};
  }});
  const element=id=>elements[id]||=( {style:{},hidden:false,className:'',getContext:()=>context} );
  const document={createElement:()=>({width:0,height:0,getContext:()=>context}),getElementById:element,addEventListener:(n,f)=>events[n]=f};
  const world=vm.createContext({document,window:{addEventListener(){}},requestAnimationFrame:fn=>raf=fn,console,assert,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,String(v))}});
  return{world,events,element,step:t=>raf(t),run:code=>vm.runInContext(code,world,{timeout:30000})};
}
function game(){const g=sandbox();g.run(fs.readFileSync(__dirname+'/game.js','utf8'));return g}
module.exports={sandbox,game,assert,fs};
