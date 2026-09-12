const {sandbox,game,assert,fs}=require('./test-support.cjs');
const g=game(),run=code=>g.run('{'+code+'}');
// Explicit chains: mixed colours, detached groups and stretched edges stop a cut.
run(`reset();beginCard(1);mode='play';intro=0;
  let a=shoot(100,300,0,0,held()),b=shoot(118,300,0,0,held()),c=shoot(136,300,0,0,held());
  weave([a,b,c]);let separate=shoot(145,300,0,0,held()),wrong=shoot(154,300,0,0,ink(1));tie(c,wrong);
  let far=shoot(220,300,0,0,held());tie(c,far);
  shots=[{x:100,y:308,vx:0,vy:-8,k:held(),life:30}];updateShots();
  assert.equal(m.broken,3);assert(a.life===0&&b.life===0&&c.life===0);assert(separate.life>0&&wrong.life>0&&far.life>0);
  let reward=score;shatter(a);assert.equal(score,reward,'dead chain cannot reward twice');
  assert.equal(m.cutDamage,10);render();
  clearBullets();assert.equal(separate.life,0);assert.equal(m.brushes.length,0);
`);
// Actual Tuesday geometry: a shot opens the chosen 80px corridor, leaves the
// other lanes intact, and cancels exactly that source's two future volleys.
const routes=[];
for(const lane of[0,1,2])for(const match of[false,true]){
  const result=run(`reset();beginCard(1);mode='play';intro=0;p.inv=1e8;bloom(0,false);for(let i=0;i<43;i++)updateBullets();
    for(let i=0;i<65;i++)updateBullets();
    let core=bullets.filter(b=>b.emitter).sort((a,b)=>a.x-b.x)[${lane}],x=core.x;
    let petals=bullets.filter(b=>b.k===core.k&&!b.emitter);
    let lowest=petals.reduce((a,b)=>a.y>b.y?a:b),before=bullets.length;
    let width=()=>{let n=0;for(let px=x-40;px<=x+40;px++)if(!bullets.some(b=>b.life>0&&segmentDistance(b.x,b.y,px,140,px,275)<b.r+2.5))n++;return n};
    let original=width();assert(original<20,'flower blocks most of this corridor');
    shots=[{x:lowest.x,y:lowest.y+8,vx:0,vy:-8,k:${match}?core.k:ink(hand.indexOf(core.k)+1),life:30}];updateShots();
    let open=width();assert.equal(m.broken,${match}?25:0);assert.equal(open,${match}?81:original);
    assert.equal(m.stopped,${match}?1:0);assert.equal(m.cutDamage,${match}?40:0);
    assert(bullets.filter(b=>b.life>0&&b.emitter&&b!==core).length===2);
    for(let i=0;i<240;i++)updateBullets();
    assert.equal(m.emitted,${match}?36:54,'future attacks depend on surviving sources');
    ({lane:${lane},match:${match},openBefore:original,openAfter:open,broken:m.broken,futureBullets:m.emitted})
  `);routes.push(result);
}
run(`reset();beginCard(4);p.ci=hand.indexOf(0);mode='play';intro=0;p.inv=1e8;crystals(0,false);
  for(let i=0;i<50;i++)updateBullets();let core=bullets.find(b=>b.seed&&b.k===held());
  let stem=bullets.filter(b=>b.k===held()&&!b.seed).reduce((a,b)=>a.y>b.y?a:b);
  shots=[{x:stem.x,y:stem.y+8,vx:0,vy:-8,k:held(),life:30}];updateShots();assert.equal(core.life,0);
  assert.equal(m.broken,5);assert.equal(m.stopped,1);
  for(let i=0;i<140;i++)updateBullets();assert.equal(m.emitted,45,'surviving lance source emits 22, violet seed emits 7+7+9');
  assert(bullets.every(b=>b.k!==held()));
  reset();beginCard(0);mode='play';intro=0;loom(0,false);let old=bullets.slice();pressed.x=true;cast();clearPress();loom(14,false);
  assert(old.every(b=>b.life===0));let fresh=bullets.length;shatter(bullets[0]);assert(m.broken<=fresh,'bomb-cleared ribbons cannot conduct ghost kills');
`);
run(`render();reset();render();assert.equal(mode,'play');
  assert.deepEqual(DAY,[5,0,4,3,2,1,6]);
  let union=new Set();for(let c=0;c<7;c++){beginCard(c);assert.equal(hand[0],DAY[c]);assert.equal(new Set(hand).size,3);assert.equal(new Set(hand.map(paint)).size,3);let colours=hand.map(paint);p.ci=2;assert.deepEqual(hand.map(paint),colours);m.lab=true;assert(hand.every(k=>paint(k)===R[k]));m.lab=false;hand.forEach(k=>union.add(k))}assert.equal(union.size,7);
  reset();assert.equal(stage,1);assert.equal(held(),0);assert.equal(recovered,0);assert.equal(boss.hp,hpCards[1]);beginCard(0);
  intro=0;p.inv=1e8;let colours=new Set();for(let i=0;i<540;i++){update();bullets.forEach(b=>colours.add(b.k))}assert.equal(colours.size,3);
  let target=bullets.find(b=>b.t>b.delay);p.x=target.x;p.y=target.y;p.inv=0;updateBullets();assert.equal(p.hp,4,'Monday has real collision damage');
  pressed.Enter=true;update();assert.equal(stage,0,'Enter cannot skip a living Monday boss');
  boss.hp=0;update();assert.equal(mode,'win');reset();beginCard(6);intro=0;boss.hp=0;update();assert.equal(mode,'clear');for(let i=0;i<60;i++)update();pressed.Enter=true;update();for(let i=0;i<200;i++)update();assert.equal(stage,0);assert.equal(held(),5);

`);
// Same-colour shots open a physical lane; a wrong colour cannot remove it.
run(`reset();beginCard(0);mode='play';intro=0;
  let obstacle=shoot(192,300,0,0,held(),6,{delay:0});
  shots=[{x:192,y:308,vx:0,vy:-8,k:ink(1),life:50}];updateShots();assert(obstacle.life>0);
  let before=boss.hp;
  shots=[{x:192,y:308,vx:0,vy:-8,k:held(),life:50},{x:192,y:308,vx:0,vy:-8,k:held(),life:50}];
  updateShots();assert.equal(obstacle.life,0);assert.equal(before-boss.hp,6,'one reward per bullet, including same-frame hits');
  p.x=192;p.y=300;updateBullets();assert.equal(p.hp,5,'the cut lane is safe');
  shoot(192,300,0,0,ink(1),6,{delay:0});updateBullets();assert.equal(p.hp,4,'uncut colour still blocks the lane');
`);
run(`reset();beginCard(0);mode='play';intro=0;keys.z=true;cast();keysClear();let fired=shots[0].k,count=shots.length;
  pressed.c=true;cast();clearPress();assert.notEqual(held(),fired);assert(shots.every(s=>s.k===fired));
  p.cool=0;keys.z=true;cast();keysClear();assert.equal(shots[count].k,held());
  let stock=p.bombs;pressed.x=true;cast();clearPress();assert.equal(p.bombs,stock-1);assert.equal(p.inv,180);assert.equal(bullets.length,0);
  keys.x=true;for(let i=0;i<5;i++)cast();keysClear();assert.equal(p.bombs,stock-1,'holding X does not consume the whole stock');
  p.bombs=0;pressed.x=true;cast();clearPress();assert.equal(p.bombs,0);
`);
// Deferred patterns never resurrect a destroyed parent or orbit bead.
run(`reset();beginCard(1);mode='play';intro=0;p.inv=1e8;bloom(0,false);for(let i=0;i<43;i++)updateBullets();
  let sleeper=bullets.find(b=>b.k===held());for(let i=0;i<65;i++)updateBullets();assert.equal(sleeper.vx,0);assert.equal(sleeper.vy,0);
  sleeper.life=0;updateBullets();for(let i=0;i<220;i++)updateBullets();assert(!bullets.includes(sleeper));assert(bullets.some(b=>len(b.vx,b.vy)>2));
  beginCard(3);intro=0;garden(0,false);let bead=m.nodes[0];bead.life=0;for(let i=0;i<300;i++)updateBullets();assert(!bullets.includes(bead));assert(m.nodes.some(b=>b.life>0&&!b.orbit));
  beginCard(2);intro=0;let bounce=shoot(8,220,PI,3,held(),5,{bounce:1,delay:0});updateBullets();assert(bounce.vx>0);assert.equal(bounce.k,held());
`);
run(`reset();beginCard(4);mode='play';intro=0;p.inv=1e8;
  let parent=shoot(100,150,0,0,held(),9,{seed:true,delay:0});
  let spared=shoot(280,150,0,0,ink(1),9,{seed:true,delay:0});
  shots=[{x:100,y:158,vx:0,vy:-8,k:held(),life:50}];updateShots();
  for(let i=0;i<150;i++)updateBullets();assert.equal(bullets.length,9);assert(bullets.every(b=>b.k===ink(1)),'only the surviving crystal produces children');
`);
// Stationary/frozen and orbiting bullets remain dangerous; shooting still works.
run(`reset();beginCard(6);mode='play';intro=0;m.frozen=true;
  shoot(p.x,p.y,0,0,ink(1),5,{delay:0});updateBullets();assert.equal(p.hp,4);
  p.inv=0;let ice=shoot(p.x,p.y-30,0,1,held(),5,{delay:0});let ix=ice.x;
  updateBullets();assert.equal(ice.x,ix);
  shots=[{x:ice.x,y:ice.y+8,vx:0,vy:-8,k:held(),life:50}];updateShots();assert.equal(ice.life,0);
  beginCard(3);intro=0;garden(0,false);let orb=bullets[0];p.x=orb.x;p.y=orb.y;orb.delay=0;updateBullets();assert.equal(p.hp,3);
`);
// Actual finale shell: the selected violet sector reaches the lower playfield.
run(`reset();beginCard(6);mode='play';intro=0;p.inv=1e8;
  for(let i=0;i<210;i++)update();assert(m.frozen);
  let sector=bullets.filter(b=>b.life>0&&b.k===held()&&b.y>H/2&&b.y<H&&b.x>20&&b.x<W-20);
  assert(sector.length>=6,'the opening colour offers a real lower-screen cut');
  let target=sector.reduce((a,b)=>Math.abs(a.x-192)<Math.abs(b.x-192)?a:b);
  shots=[{x:target.x,y:target.y+8,vx:0,vy:-8,k:held(),life:30}];updateShots();assert.equal(target.life,0);
  for(let i=0;i<90;i++)update();assert(!bullets.includes(target),'the cut persists when the shell starts moving again');
`);
// Every stage, both difficulty halves: screen bounds, palette, opportunities.
const metrics=[];
for(let c=0;c<7;c++)for(const strong of[false,true]){
  const out=run(`reset();beginCard(${c});mode='play';intro=0;p.inv=1e8;if(${strong})boss.hp=boss.max*.45;
    let peak=0,visible=0,near=0,seen=new Set();
    for(let i=0;i<5400;i++){
      keys.ArrowLeft=i%360<180;keys.ArrowRight=!keys.ArrowLeft;update();
      assert.equal(mode,'play');assert.equal(card,${c});assert(Number.isFinite(p.x+p.y+boss.hp));peak=Math.max(peak,bullets.length);
      const screen=bullets.filter(b=>b.life>0&&b.x>=0&&b.x<=W&&b.y>=0&&b.y<=H&&b.t>b.delay);
      screen.forEach(b=>{assert(Number.isInteger(b.k)&&b.k>=0&&b.k<7);assert(hand.includes(b.k),"all hazards must stay inside the authored encounter palette");assert(PALETTES[stage].map(k=>R[k]).includes(paint(b.k)),"visible hazards use only the chapter colours");seen.add(b.k);assert(Number.isFinite(b.x+b.y+b.vx+b.vy+b.r))});
      if(screen.some(b=>hand.includes(b.k)))visible++;
      if(screen.some(b=>hand.includes(b.k)&&b.y>=H/2))near++;
      if(i%80===0)render();
    }
    assert(peak<600);assert(hand.every(k=>seen.has(k)));assert(visible>2700,'matching colours are actually on screen for most of the encounter');assert(near>1000,'matching colours reach the playable lower half');keysClear();
    ({stage:${c}+1,strong:${strong},peak,visible:Math.round(visible/54),lowerHalf:Math.round(near/54)})
  `);metrics.push(out);
}
run(`reset();mode='play';for(let c=0;c<7;c++){beginCard(c);intro=0;boss.hp=0;assert(advance());assert.equal(recovered,ORDER.indexOf(c)+1);assert.equal(mode,c===0?'win':'clear');render()}
  reset();beginCard(0);mode='play';intro=0;p.hp=1;p.inv=0;hit();assert.equal(mode,'over');let dead=clock;for(let i=0;i<90;i++)update();assert.equal(clock,dead);reset();assert.equal(mode,'play');
  pressed.Enter=true;update();for(let i=0;i<200;i++)update();boss.hp=0;update();assert.equal(mode,'clear');for(let i=0;i<60;i++)update();pressed.Enter=true;update();for(let i=0;i<200;i++)update();assert.equal(stage,2);assert.equal(mode,'play');
`);
const shipped=sandbox(),html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
shipped.run(html.match(/<script>([\s\S]*)<\/script>/)[1]);shipped.step(1);shipped.element('start').onclick();
for(let t=17;t<2500;t+=17)shipped.step(t);
assert.equal(shipped.element('menu').hidden,true);
shipped.events.keydown({key:'Enter',preventDefault(){}});shipped.step(2517);shipped.events.keyup({key:'Enter',preventDefault(){}});
for(let t=2534;t<6000;t+=17)shipped.step(t);
for(const key of['z','c','x','ArrowRight']){shipped.events.keydown({key,preventDefault(){}});shipped.step(6017);shipped.step(6050);shipped.events.keyup({key,preventDefault(){}})}
shipped.events.keydown({key:'Escape',preventDefault(){}});shipped.step(6100);assert.equal(shipped.element('pause').className,'on');
assert(fs.statSync(__dirname+'/dist/stolen-rainbow-13k.zip').size<=13312);
console.table(routes);console.table(metrics);console.log('PASS: linked geometry, three physical routes, source cancellation, bounded chain damage, no ghost chains, weekday palette, shot colour, bomb edge/stock, frozen/orbit collisions, seven encounters × two halves × 5400 frames, progression, defeat, compressed runtime.');
