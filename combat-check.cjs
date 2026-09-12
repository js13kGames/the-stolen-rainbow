// Functional differences, not just seven different projectile parameter lists.
const {game,assert}=require('./test-support.cjs');
const g=game(),run=code=>g.run('{'+code+'}');
g.run(`function bench(k){reset();beginCard(DAY.indexOf(k));mode='practice';intro=0;m.lab=true;hand=[k,(k+2)%7,(k+4)%7];p.x=192;p.y=350;boss.x=20;boss.y=30;keysClear();}
function volley(){keys.z=true;cast();keysClear();}
function fly(n){for(let i=0;i<n;i++)updateShots();}
function targetAt(x,y,k){return shoot(x,y,0,0,k,5,{delay:0});}`);
run(`bench(0);let near=targetAt(192,250,0),far=targetAt(192,95,0);volley();fly(65);
  assert.equal(near.life,0);assert(far.life>0,'flame fan cannot snipe across the screen');
  bench(0);volley();let spread=Math.max(...shots.map(s=>Math.abs(s.vx)));bench(0);keys.Shift=true;volley();assert(Math.max(...shots.map(s=>Math.abs(s.vx)))<spread);`);
run(`bench(2);let row=[260,180,100].map(y=>targetAt(192,y,2)),wrong=targetAt(192,210,0);volley();fly(40);
  assert(row.every(b=>b.life===0),'gold pierces separate formations');assert(wrong.life>0);`);
run(`bench(4);let row=[165,192,219].map(x=>targetAt(x,240,4)),wrong=targetAt(205,240,0);volley();fly(25);
  assert(row.every(b=>b.life===0),'water sweeps a wide unlinked front');assert(wrong.life>0);`);
run(`bench(4);boss.x=224;boss.y=240;volley();fly(25);assert.equal(m.damage,5,'wave width applies to the boss too');`);
run(`bench(1);let row=[175,192,215].map(x=>targetAt(x,180,1)),wrong=targetAt(200,180,2);volley();fly(60);
  assert(row.every(b=>b.life===0),'earth shell breaks separate nearby clusters');assert(wrong.life>0);let count=m.broken;fly(20);assert.equal(m.broken,count);
  bench(1);volley();fly(50);assert.equal(m.pulses.length,1,'a missed shell still bursts at its range limit');`);
run(`bench(3);let core=shoot(302,160,0,0,3,9,{emitter:{wait:120,period:60,pulses:1,n:5,spread:.1,speed:1}});volley();fly(75);assert.equal(core.life,0,'leaves reach an off-axis source');
  bench(2);let side=targetAt(302,160,2);volley();fly(60);assert(side.life>0,'lance needs alignment');`);
run(`bench(3);for(let y of[110,170,240])for(let j=-2;j<=2;j++)targetAt(192+j*14,y,3);
  let source=shoot(302,135,0,0,3,10,{emitter:{wait:180,period:120,pulses:1,n:5,spread:.16,speed:1.5}});
  volley();fly(80);assert.equal(source.life,0,'ordinary clutter must not steal source priority');assert.equal(m.stopped,1);`);
run(`bench(5);let side=targetAt(242,365,5),wrong=targetAt(142,365,0);volley();fly(50);assert.equal(side.life,0,'night guard cuts beside/behind the player');assert(wrong.life>0);assert.equal(p.inv,0,'night guard is not invulnerability');
  bench(5);volley();let fired=shots.map(s=>s.k);pressed.c=true;cast();clearPress();assert(shots.every((s,i)=>s.k===fired[i]));`);
run(`bench(6);volley();let dart=shots[1];fly(24);let away=Math.hypot(dart.x-dart.homeX,dart.y-dart.homeY);assert(away>120);p.x=30;p.y=420;
  fly(18);assert(Math.hypot(dart.x-dart.homeX,dart.y-dart.homeY)<away,'echo returns to the firing position');assert.equal(dart.homeX,192);fly(50);assert(!shots.includes(dart));`);
// Active emitters freeze their timers; a removed core cannot fire on thaw.
run(`bench(3);let core=shoot(192,100,0,0,3,9,{delay:0,emitter:{wait:10,period:10,pulses:2,n:5,spread:.1,speed:1}});
  for(let i=0;i<9;i++)updateBullets();m.frozen=true;for(let i=0;i<40;i++)updateBullets();assert.equal(core.t,9);assert.equal(m.emitted,0);
  shatter(core);m.frozen=false;for(let i=0;i<40;i++)updateBullets();assert.equal(m.emitted,0);`);
run(`bench(3);shoot(192,100,0,0,3,9,{life:1,delay:0,emitter:{wait:1,period:1,pulses:1,n:5,spread:.1,speed:1}});updateBullets();assert.equal(m.emitted,0,'expired sources cannot fire');`);
// Telegraph locks a direction and does not secretly track the player at launch.
run(`bench(2);aimedNeedles(2,3,60);let needle=bullets[0];for(let i=0;i<51;i++)updateBullets();assert(m.cues.length>0);let aim=needle.aim;p.x=370;
  for(let i=0;i<30;i++)updateBullets();assert(Math.abs(Math.atan2(needle.vy,needle.vx)-aim)<1e-9);assert(Math.hypot(needle.vx,needle.vy)>3);`);
const phases=[];
for(let stage=0;stage<7;stage++){
  const out=run(`reset();beginCard(${stage});mode='play';intro=0;p.inv=1e8;let phases=new Set();
    for(let i=0;i<600;i++){update();phases.add(m.phase)}assert(phases.size>=3,'encounter changes structure within one cycle');
    ({stage:${stage},phases:[...phases]})`);phases.push(out);
}
// All real weapons, moving player and changing hues: finite rendering and caps.
for(let k=0;k<7;k++)run(`bench(${k});p.inv=1e8;for(let i=0;i<1200;i++){
  if(i%120===0)for(let j=0;j<12;j++)targetAt(32+j*28,140+(j%3)*45,${k});
  keys.z=true;keys.ArrowLeft=i%160<80;keys.ArrowRight=!keys.ArrowLeft;update();
  assert(shots.length<100);assert(shots.every(s=>Number.isFinite(s.x+s.y+s.vx+s.vy)));if(i%30===0)render();}
  keysClear();`);
console.table(phases.map(p=>({stage:p.stage,phases:p.phases.length})));
// With no matching projectile available, support weapons must still reach the seal.
for(let k of [3,6])run(`bench(${k});boss.x=192;boss.y=80;p.y=270;keys.z=true;let dealt=0;const realDamage=damage;damage=n=>dealt+=n;
 for(let i=0;i<600;i++){cast();updateShots();if(p.cool)p.cool--;if(p.reload[held()])p.reload[held()]--}
 damage=realDamage;assert(dealt>120,'support weapon still damages an unobstructed seal');`);
console.log('PASS: seven functional weapons, range/width/piercing/homing/burst/orbit/return, frozen emitter cancellation, fixed aim telegraph, multi-phase encounters, projectile stress.');
