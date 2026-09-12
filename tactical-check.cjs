// Counterfactuals use the real scheduled formations. They isolate one volley,
// not human skill, whole-stage survival, or subjective enjoyment.
const {game, assert, fs}=require('./test-support.cjs');
const g=game(), run=code=>g.run('{'+code+'}');
g.run(`function setup(c,k,x=192,y=350){reset();beginCard(c);mode='practice';intro=0;m.lab=true;p.x=x;p.y=y;p.ci=hand.indexOf(k);boss.x=20;boss.y=25;keysClear();}
function castOnce(){keys.z=true;cast();keysClear()}
function tickCombat(n){for(let i=0;i<n;i++){updateShots();updateBullets()}}
function single(k){shots=[{x:p.x,y:p.y-12,vx:0,vy:-7,k,kind:-1,r:3,life:80,pierce:1}];}`);
const results=[];
for(const real of [false,true]) results.push(run(`setup(4,2,312);crystals(180,false);let root=bullets.find(b=>b.k===2&&b.emitter);
  ${real?'castOnce()':'single(2)'};tickCombat(45);let removed=m.broken;
  assert.equal(root.life===0,${real});assert.equal(removed,${real}?10:3);tickCombat(165);
  ({case:'Friday independent gates',real:${real},removed,sources:m.stopped,emitted:m.emitted})`));
for(const real of [false,true]) results.push(run(`setup(1,1);bloom(244,false);for(let i=0;i<37;i++)updateBullets();${real?'castOnce()':'single(1)'};tickCombat(60);
  assert.equal(m.stopped,${real}?3:1);let removed=m.broken;tickCombat(120);
  ({case:'Tuesday three earth clusters',real:${real},removed,sources:m.stopped,emitted:m.emitted})`));
for(const real of [false,true]) results.push(run(`setup(2,4);echo(180,false);${real?'castOnce()':'single(4)'};tickCombat(42);
  let removed=m.broken;assert(${real} ? removed>=6 : removed===3);
  ({case:'Wednesday separate blue fronts',real:${real},removed,sources:m.stopped,emitted:m.emitted})`));
for(const real of [false,true]) results.push(run(`setup(3,3,60);garden(0,false);${real?'castOnce()':'single(3)'};tickCombat(85);
  let stopped=m.stopped;assert(${real}?stopped>0:stopped===0);tickCombat(120);
  ({case:'Thursday green sources, left flank',real:${real},removed:m.broken,sources:stopped,emitted:m.emitted})`));
for(const real of [false,true]) results.push(run(`setup(1,0,192,340);bloom(364,false);for(let i=0;i<37;i++)updateBullets();${real?'castOnce()':'single(0)'};tickCombat(25);
  assert.equal(m.broken,${real}?15:3);
  ({case:'Tuesday five flame ribbons',real:${real},removed:m.broken,sources:m.stopped,emitted:m.emitted})`));
// Return burst must work after movement and switching away; without the return
// leg the purple source must survive and actually produce its delayed volleys.
for(const c of [2,4,6])for(const real of [false,true]) results.push(run(`setup(${c},6);[echo,crystals,returning][${[2,4,6].indexOf(c)}](${c===6?285:180},false);
  let source=bullets.find(b=>b.k===6&&b.delay===48);assert(source);castOnce();
  tickCombat(24);assert(source.life>0,'outbound attack must not already solve the snare');
  if(!${real})shots=[];p.x=65;pressed.c=true;cast();clearPress();tickCombat(46);
  assert.equal(source.life===0,${real});let stopped=m.stopped;tickCombat(100);
  ({case:'Day ${c} violet departure/return',real:${real},removed:m.broken,sources:stopped,emitted:m.emitted})`));
let caught=0;
for(let i=0;i<24;i++)caught+=run(`setup(3,5,192,250);mode='play';p.inv=0;castOnce();let a=${i}*TAU/24;
  shoot(p.x+Math.cos(a)*100,p.y+Math.sin(a)*100,a+PI,3.2,5,4,{delay:0});tickCombat(40);assert.equal(p.hp,5);m.broken===1?1:0`);
assert.equal(caught,24);
run(`setup(3,5,192,250);mode='play';p.inv=0;castOnce();shoot(292,250,PI,3.2,1,4,{delay:0});tickCombat(40);assert.equal(p.hp,4,'other colours remain dangerous');`);
run(`setup(3,5);castOnce();let n=shots.length;keys.z=true;pressed.c=true;cast();clearPress();assert(shots.length>n,'ready next weapon fires immediately');
  n=shots.length;pressed['3']=true;cast();clearPress();assert.equal(held(),5);assert.equal(shots.length,n,'switching back cannot reset reload');keysClear();
  for(let i=0;i<48;i++)update();assert.equal(p.reload[5],0);castOnce();assert(shots.some(s=>s.kind===5&&s.t===0));
  mode='over';score=999;clearTime=46;pressed.r=true;update();assert.equal(score,0,'retry restores entry score');assert.equal(mode,'play');assert.equal(stage,3);assert.equal(p.hp,5);assert.equal(p.bombs,3);`);
fs.mkdirSync('qa-output',{recursive:true});fs.writeFileSync('qa-output/tactical-results.json',JSON.stringify({results,radialCaught:caught},null,2));
console.table(results);console.log('PASS: scheduled weapon/formation fit, future volley cancellation, fixed return point after switching, 24 radial directions, colour restriction, reload without switch exploit, same-day retry.');
