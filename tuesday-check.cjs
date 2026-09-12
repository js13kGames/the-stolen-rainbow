const {game,assert,fs}=require('./test-support.cjs');
// A summon is visible before a bullet exists, has no collision/reward, and
// cannot survive a bomb, scene change, or removal of its parent.
{
 const g=game();g.run(`reset();beginCard(1);mode='play';intro=0;p.x=192;p.y=198;
 for(let i=0;i<42;i++)update();
 assert.equal(bullets.length,0);assert.equal(m.summons.length,3);assert.equal(p.hp,5);
 keys.z=true;cast();keysClear();updateShots();assert.equal(m.broken,0);render();
 let timers=m.summons.map(v=>v.t);m.frozen=true;
 for(let i=0;i<60;i++)updateBullets();assert.deepEqual(m.summons.map(v=>v.t),timers);
 m.frozen=false;updateBullets();assert.equal(bullets.length,75);assert.equal(m.summons.length,0);
 for(let i=0;i<12;i++)updateBullets();assert.equal(p.hp,4,'materialized flower remains dangerous');
 reset();beginCard(1);mode='play';intro=0;update();pressed.x=true;cast();clearPress();
 assert.equal(m.summons.length,0);for(let i=0;i<100;i++)updateBullets();assert.equal(bullets.length,0);
 reset();beginCard(1);mode='play';intro=0;update();beginCard(2);assert.equal(m.summons.length,0);
 reset();beginCard(1);mode='play';intro=0;p.inv=1e8;
 for(let i=0;i<165;i++)update();assert.equal(m.summons.length,3);
 let parent=m.bloom.gates[0];shatter(parent);for(let i=165;i<=180;i++)update();
 assert.equal(m.bloom.hunters.length,2);assert(m.bloom.hunters.every(b=>b.cx!==parent.x));
 reset();beginCard(1);mode='play';intro=0;p.inv=1e8;
 for(let i=0;i<384;i++)update();assert(m.summons.some(v=>v.follow));
 let nest=m.bloom.hunters[0];shatter(nest);updateBullets();
 assert(m.summons.every(v=>v.owner!==nest));
 pressed.x=true;cast();clearPress();for(let i=384;i<=400;i++)update();
 assert.equal(bullets.length,0,'bomb cancels even the shared red front during its warning');`);
}
// Restarting petals show their locked direction before moving; moving after
// the tell cannot make them secretly retarget at release.
{
 const g=game();g.run(`reset();beginCard(1);mode='play';intro=0;p.inv=1e8;bloom(0,false);
 for(let i=0;i<287;i++)updateBullets();let petal=bullets.find(b=>b.stop&&b.notice);
 assert(petal.aim!==undefined);assert.equal(petal.vx,0);assert.equal(petal.vy,0);assert(m.cues.length>0);
 let locked=petal.aim;p.x=370;for(let i=0;i<28;i++)updateBullets();
 assert(Math.abs(Math.atan2(petal.vy,petal.vx)-locked)<1e-9);render();`);
}
// Original opening geometry remains covered in check.cjs. Here, removal must
// change the next phase, not merely subtract the already present bullets.
const causal=[];
for(const cut of [false,true]){
 const g=game();causal.push(g.run(`reset();beginCard(1);mode='play';intro=0;p.inv=1e8;
 for(let i=0;i<=180;i++){keys.z=${cut}&&i===60;update()}
 assert.equal(m.bloom.hunters.length,${cut}?2:3);assert.equal(m.exposed,${cut});
 assert.equal(m.bloom.route,${cut}?192:-1);
 ({flowerCut:${cut},nextNests:m.bloom.hunters.length,opening:m.exposed})`));
}
for(const bomb of [false,true]){
 const g=game();g.run(`reset();beginCard(1);mode='play';intro=0;p.inv=1e8;for(let i=0;i<180;i++)update();
 if(${bomb}){pressed.x=true;cast();clearPress()}else{for(let b of m.bloom.gates)shatter(b)}
 update();assert.equal(m.bloom.hunters.length,0,'removed flowers cannot create delayed nests');`);
}
const g=game();
g.run(`reset();beginCard(1);mode='play';intro=0;p.inv=1e8;
 for(let i=0;i<=180;i++)update();let nest=m.bloom.hunters[0];
 let before=m.emitted;for(let b of bullets)if(b!==nest)b.life=0;
 for(let i=0;i<100;i++)updateBullets();assert.equal(m.emitted-before,21);
 let buds=bullets.filter(b=>b.emitter&&b.k===1);assert.equal(buds.length,3);
 assert(buds.every(b=>b.emitter.hue===0),'green nest creates orange sources which produce red return fire');
 shatter(nest);for(let b of buds)shatter(b);before=m.emitted;
 for(let i=0;i<220;i++)updateBullets();assert.equal(m.emitted,before,'removed nest and buds cannot emit later');
 reset();beginCard(1);mode='play';intro=0;m.frozen=true;
 let egg=shoot(192,120,0,0,3,9,{delay:0,emitter:{pod:true,wait:1,period:20,pulses:1}});
 updateBullets();assert.equal(m.emitted,0);m.frozen=false;egg.life=0;updateBullets();assert.equal(m.emitted,0);`);
const replay=fs.readFileSync('tuesday-replay.js','utf8'),results=[];
for(const combo of [false,true]){
 const g=game();g.run(replay);
 results.push(g.run(`reset();beginCard(1);mode='play';intro=0;let hits=0,firstCycle;
 for(let i=0;i<3600&&mode==='play';i++){
   tuesdayInput(${combo});let hp=p.hp;update();if(p.hp<hp)hits+=hp-p.hp;
   if(i===599)firstCycle={hp:p.hp,emitted:m.emitted,broken:m.broken,boss:Math.round(boss.hp)};
   if(i%30===0)render();
 }
 assert(${combo}?mode==='clear':mode==='over');
 ({combo:${combo},seconds:clock/60,mode,hits,firstCycle,emitted:m.emitted,broken:m.broken})`));
}
assert(results[1].firstCycle.emitted<results[0].firstCycle.emitted);
assert(results[1].hits<results[0].hits);
fs.mkdirSync('qa-output',{recursive:true});
fs.writeFileSync('qa-output/tuesday-results.json',JSON.stringify({causal,results},null,2));
console.table(causal);console.table(results.map(({firstCycle,...r})=>({...r,firstCycle:JSON.stringify(firstCycle)})));
console.log('PASS: pre-spawn tells without collision/reward, frozen summon timers, bomb/parent/scene cancellation, locked petal relaunch, missing flowers change nests, green-to-orange-to-red lineage, same-route real-input comparison. This is one authored route, not human playtesting.');
