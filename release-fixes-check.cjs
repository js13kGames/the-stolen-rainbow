// Regressions for independently coloured seed warnings and release tooling.
const {sandbox}=require('./test-support.cjs');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const sourceDir=process.env.AUDIT_SOURCE_DIR||__dirname;
const source=fs.readFileSync(path.join(sourceDir,'game.js'),'utf8');
function checkSeedWarnings(){
  for(const role of [0,6]){
    const g=sandbox();g.run(source);
    g.run(`{
      reset();beginCard(4);intro=0;p.inv=1e8;clearBullets();crystals(0,false);
      const core=bullets.find(b=>b.seed&&b.k===${role});assert(core);
      let calls=[],frames=0,emitterWarnings=0;
      charge=(x,y,k,r,progress)=>{if(x===core.x&&y===core.y)calls.push({k,progress})};
      while(core.t-core.delay<150){
        calls=[];actor();const age=core.t-core.delay;
        if(age>=114){
          frames++;assert(calls.some(c=>c.k===core.k),'seed colour must be shown for all 36 frames');
          if(age<135){assert(calls.some(c=>c.k===2),'independent emitter colour remains visible');emitterWarnings++}
          else assert(calls.every(c=>c.k===core.k),'exhausted emitter cannot recolour the seed warning');
        }
        if(age===120){m.frozen=true;const t=core.t;updateBullets();assert.equal(core.t,t);m.frozen=false}
        updateBullets();
      }
      assert.equal(frames,36);assert.equal(emitterWarnings,21);
      assert.equal(bullets.filter(b=>b.t===0&&b.k===core.k).length,9);
      clearBullets();calls=[];actor();assert.equal(calls.length,0,'cleared seeds lose their warnings');
    }`);
  }
}
function runNode(args,cwd){return cp.spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:60000})}
function copy(names,dir){for(const n of names)fs.copyFileSync(path.join(sourceDir,n),path.join(dir,n))}
async function main(){
  checkSeedWarnings();console.log('PASS real Friday seeds: both colours, 36-frame warning, overlapping emitter, freeze and cancellation');
  if(process.argv.includes('--seed-only'))return;
  const out=path.join(__dirname,'qa-output');fs.mkdirSync(out,{recursive:true});
  const fixture=fs.mkdtempSync(path.join(out,'release-fixes-'));
  copy(['game.js','index.html','preview.cjs','tuesday-replay.js','build.cjs','compression.json','review-server.cjs'],fixture);
  let r=runNode(['preview.cjs'],fixture);assert.equal(r.status,0,r.stderr);
  const html=fs.readFileSync(path.join(fixture,'qa.html'),'utf8');
  const qaSource=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const REVIEW'));
  assert(qaSource,'generated QA contains the game source');
  const storage=new Map([['rainbow13k2026:high','900'],['rainbow13k2026:qa:high','42']]);
  const qa=sandbox();qa.world.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,String(v))};qa.run(qaSource);
  assert.equal(qa.run('high'),42);qa.run("reset();mode='practice';score=543210;goTitle()");
  assert.equal(storage.get('rainbow13k2026:high'),'900');assert.equal(storage.get('rainbow13k2026:qa:high'),'543210');
  qa.run('reset();intro=0;boss.hp=0;advance()');assert.equal(storage.get('rainbow13k2026:high'),'900');
  const game=sandbox();game.world.localStorage=qa.world.localStorage;game.run(source);assert.equal(game.run('high'),900);
  console.log('PASS generated QA: independent reads, practice/clear writes and unchanged main high score');
  r=runNode(['build.cjs'],fixture);assert.equal(r.status,0,r.stderr);
  const outputs=['dist/index.html','dist/stolen-rainbow-13k.zip','compression.json'];
  const saved=outputs.map(n=>fs.readFileSync(path.join(fixture,n)));
  const original=fs.readFileSync(path.join(fixture,'index.html'));
  fs.appendFileSync(path.join(fixture,'index.html'),'<!--'+crypto.randomBytes(20000).toString('hex')+'-->');
  r=runNode(['build.cjs'],fixture);assert.notEqual(r.status,0);assert.match(r.stderr,/ZIP exceeds/);
  outputs.forEach((n,i)=>assert(fs.readFileSync(path.join(fixture,n)).equals(saved[i]),'oversize must preserve '+n));
  fs.writeFileSync(path.join(fixture,'index.html'),Buffer.concat([original,Buffer.from('<!-- output replacement regression -->')]));
  fs.writeFileSync(path.join(fixture,'fail-replace.cjs'),`const fs=require('node:fs'),rename=fs.renameSync;let failed=false;fs.renameSync=(a,b)=>{if(!failed&&b.endsWith('stolen-rainbow-13k.zip')){failed=true;throw Error('injected replacement failure')}return rename(a,b)};`);
  r=runNode(['--require','./fail-replace.cjs','build.cjs'],fixture);assert.notEqual(r.status,0);assert.match(r.stderr,/injected replacement failure/);
  outputs.forEach((n,i)=>assert(fs.readFileSync(path.join(fixture,n)).equals(saved[i]),'replacement failure must restore '+n));
  for(const n of outputs)assert(!fs.existsSync(path.join(fixture,n+'.tmp')));
  console.log('PASS build: oversized input preserves all outputs; partial replacement rolls back without temp files');
  fs.unlinkSync(path.join(fixture,'qa.html'));
  const child=cp.spawn(process.execPath,['review-server.cjs'],{cwd:fixture,env:{...process.env,PORT:'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  try{
    const url=await new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>reject(Error('preview server did not start')),10000);child.stdout.on('data',data=>{text+=data;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timeout);resolve(match[0])}});child.on('error',e=>{clearTimeout(timeout);reject(e)});child.on('exit',code=>{clearTimeout(timeout);reject(Error('preview exited '+code))})});
    let response=await fetch(url);assert.equal(response.status,200);assert.equal(await response.text(),fs.readFileSync(path.join(fixture,'index.html'),'utf8'));
    fs.writeFileSync(path.join(fixture,'qa.html'),'QA preview fixture');response=await fetch(url);assert.equal(await response.text(),'QA preview fixture');
    console.log('PASS preview: fresh source opens game; generated QA becomes the default');
  }finally{child.kill()}
}
main().catch(error=>{console.error(error);process.exitCode=1});
