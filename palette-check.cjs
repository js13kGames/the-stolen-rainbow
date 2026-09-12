const {game,assert}=require('./test-support.cjs');
// Explicit visual expectation independent of the game's mapping implementation.
const expected=[[5,4,6],[0,2,1],[4,5,6],[3,2,4],[2,1,3],[1,0,2],[6,5,4]];
for(let day=0;day<7;day++)for(let slot=0;slot<3;slot++){
const g=game();g.run(`reset();beginCard(${day});intro=0;
let expected=${JSON.stringify(expected[day])};assert.deepEqual(hand.map(colour),expected);assert.equal(new Set(palette).size,7,'different matching ids must never look identical');
pressed[String(${slot}+1)]=true;keys.z=true;cast();keysClear();clearPress();assert.equal(p.ci,${slot});assert(shots.length>0);let fired=held(),firedPaint=R[expected[${slot}]];assert(shots.every(s=>s.kind===fired),'attack trajectories stay assigned to the original three slots');
pressed.c=true;cast();clearPress();assert.equal(p.ci,(${slot}+1)%3);pressed['7']=true;cast();clearPress();assert.equal(p.ci,(${slot}+1)%3,'unrequested seven-weapon expansion is removed');
let colours=[],gems=[],tiles=[];const oldTile=tile;tile=(key,...a)=>{tiles.push(key);return oldTile(key,...a)};const oldCircle=circle,oldPath=path,oldLine=line,oldUnicorn=unicorn,oldKeeper=keeper,oldBox=box,oldHitmark=hitmark;
box=(...a)=>{colours.push(a[4]);oldBox(...a)};
circle=(...a)=>{colours.push(a[3],a[4]);oldCircle(...a)};
path=(...a)=>{colours.push(a[1],a[2]);if(a[0].length===4&&a[0][0][1]===299)gems.push(a[1]);oldPath(...a)};
line=(...a)=>{colours.push(a[4]);oldLine(...a)};
unicorn=keeper=hitmark=()=>{};actor();assert(colours.includes(firedPaint),'already-fired shots retain their actual colour after switching');assert(!colours.includes(paint(held())),'switching cannot repaint earlier shots');
hitmark=oldHitmark;colours=[];hitmark(p.x,p.y);assert(colours.includes(paint(held())),'hit marker follows current selection');assert(colours.includes(CR),'hit centre remains white');
hud();assert.deepEqual(gems,expected.map(k=>R[k]),'three HUD gems agree with the chapter palette');
shots=[];colours=[];let target=shoot(100,200,0,0,fired,5,{delay:0});target.t=1;actor();assert(colours.includes(firedPaint),'whole enemy bullet matches player shot colour');
colours=[];charge(100,200,fired,20,.5);assert(colours.includes(firedPaint));assert(colours.filter(c=>R.includes(c)).every(c=>c===firedPaint),'all parts of the firing warning use the same colour');
colours=[];oldUnicorn(p.x,p.y);assert(tiles.includes('7'+CR+paint(held())),'cached unicorn uses the selected colour');assert(colours.filter(c=>R.includes(c)).every(c=>expected.map(k=>R[k]).includes(c)),'player accents stay in this chapter palette');
shots=[{x:100,y:208,vx:0,vy:-8,k:held(),life:20}];updateShots();assert(target.life>0,'different visible colour cannot destroy target');
shots=[{x:100,y:208,vx:0,vy:-8,k:fired,life:20}];updateShots();assert.equal(target.life,0,'same visible colour destroys target');
clearBullets();let row=[0,1,2].map(i=>shoot(100+i*18,200,0,0,fired,5,{delay:0}));weave(row);shatter(row[0]);assert(row.every(b=>b.life===0));
clearBullets();row=[0,1,2].map(i=>shoot(100+i*18,200,0,0,fired,5,{delay:0}));let wrong=shoot(125,205,0,0,held(),5,{delay:0});shellBurst({x:118,y:200,k:fired});assert(row.every(b=>b.life===0));assert(wrong.life>0);
`);
}
console.log('PASS: seven related weekday palettes × three unchanged weapons; actual player, projectile, HUD and warning colours; switching, same/wrong-colour collision, chains and area attacks.');
