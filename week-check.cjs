const {game,assert,fs}=require('./test-support.cjs');
const evidence=[];
const defeats=[];
for(let day=0;day<7;day++){
 const g=game();
 evidence.push(g.run(`reset();beginCard(${day});mode='play';intro=0;
 update();assert.equal(bullets.length,0,'every opening begins with a tell');assert(m.summons.length>0);
 let pending=m.summons.flatMap(v=>v.preview||[]),timers=m.summons.map(v=>v.t);
 if(pending.length){p.x=pending[0].x;p.y=pending[0].y;shatter(pending[0]);assert.equal(m.broken,0)}
 m.frozen=true;for(let i=0;i<45;i++)updateBullets();assert.deepEqual(m.summons.map(v=>v.t),timers);assert.equal(p.hp,5);render();
 clearBullets();assert(pending.every(b=>b.life===0));m.frozen=false;
 for(let i=0;i<80;i++)updateBullets();assert.equal(bullets.length,0,'cleared previews cannot resurrect');
 reset();beginCard(${day});mode='play';intro=0;p.inv=1e8;let peak=0,previews=0,phases=new Set(),colours=new Set();
 for(let i=0;i<900;i++){update();peak=Math.max(peak,bullets.length);previews+=m.summons.length>0;phases.add(m.phase);bullets.forEach(b=>colours.add(b.k));if(i%20===0)render()}
 assert(phases.size>=3);assert(previews>=72);assert(hand.every(k=>colours.has(k)));assert(peak<600);
 let alive=bullets.find(b=>b.life>0&&b.t>b.delay);assert(alive);p.x=alive.x;p.y=alive.y;p.inv=0;updateBullets();assert.equal(p.hp,4,'all seven days have real damage');
 p.hp=1;p.inv=0;shoot(p.x,p.y,0,0,held(),5,{delay:0});updateBullets();assert.equal(mode,'over');
 clearTime=46;pressed.r=true;update();assert.equal(mode,'play');assert.equal(stage,${day});assert.equal(p.hp,5);assert.equal(p.bombs,3);
  ({day:${day},phases:phases.size,tellFrames:previews,peak})`));
 // Invulnerability isolates attack/health progression; it is not a survival
 // or difficulty claim. Damage still comes only from real movement and shots.
 defeats.push(g.run(`reset();beginCard(${day});intro=0;p.inv=1e8;
 for(let i=0;i<7200&&mode==='play';i++){
 keys.z=true;keys.Shift=true;keys.ArrowUp=p.y>258;keys.ArrowDown=p.y<250;
 let target=192+Math.sin(i*.008)*75;keys.ArrowLeft=p.x>target+3;keys.ArrowRight=p.x<target-3;
 if(i%90===0)pressed[String(Math.floor(i/90)%3+1)]=true;update();
 }
 assert.equal(mode,${day}===0?'win':'clear');assert(boss.hp<=0);
 ({day:${day},seconds:clock/60,broken:m.broken,mode})`));
}
const g=game();
g.run(`reset();intro=0;p.inv=1e8;
 // A chain may connect consecutive waves after both materialize, but not
 // destroy the future wave through a still-forming neighbour.
 let first,second;prepare(()=>{first=shoot(100,100,0,0,5,4,{delay:0})});
 for(let i=0;i<37;i++)updateBullets();
 prepare(()=>{second=shoot(110,100,0,0,5,4,{delay:0});tie(first,second)});
 updateBullets();assert(first.links.includes(second));shatter(first);assert.equal(second.life,600);
 for(let i=0;i<36;i++)updateBullets();assert(bullets.includes(second));assert(!second.forming);
 // Orbit releases lock their direction before launch, including tangent arcs.
 for(let tangent of [false,true]){
 clearBullets();let b=shoot(200,140,0,0,5,4,{delay:0,orbit:true,cx:192,cy:150,phase:0,radius:80,spin:.01,release:80,tangent});
 for(let i=0;i<52;i++)updateBullets();let aim=b.aim;assert(Number.isFinite(aim));p.x=8;p.y=430;
 for(let i=0;i<28;i++)updateBullets();assert(Math.abs(Math.atan2(b.vy,b.vx)-aim)<1e-9);
 }
 reset();intro=0;p.inv=1e8;let order=[];
 for(let [step,day] of [1,2,3,4,5,6,0].entries()){
 assert.equal(stage,day);assert.equal(mode,'play');assert.equal(boss.max,hpCards[day]);order.push(held());
 boss.hp=0;update();assert.equal(recovered,step+1);assert.equal(mode,day===0?'win':'clear');
 assert.equal(m.summons.length,0);assert.equal(bullets.length,0);
 if(step<6){for(let i=0;i<60;i++)update();pressed.Enter=true;update();for(let i=0;i<200;i++)update()}
 }
 assert.deepEqual(order,[0,4,3,2,1,6,5]);assert.equal(mode,'win');
 // Form controls must retain their native arrows; Tab is not trapped by the game.
 let prevented=false;inputKey({key:'ArrowDown',target:{tagName:'SELECT'},preventDefault(){prevented=true}},true);assert(!prevented);
 inputKey({key:'Tab',preventDefault(){prevented=true}},true);assert(!prevented);
`);
fs.writeFileSync('qa-output/week-results.json',JSON.stringify({evidence,defeats},null,2));
console.table(evidence);
console.table(defeats);
console.log('PASS: all seven opening tells, freeze/clear cancellation, real damage, multiple phases, pending chain isolation, fixed orbit release, Tuesday-to-Monday progression, native form keys.');

