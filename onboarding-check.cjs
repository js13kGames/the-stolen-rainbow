const {game,assert}=require('./test-support.cjs');const g=game();g.run(`
reset();goTitle();start();let first=transition;start();assert.equal(transition,first,'repeated start does not restart fade');
for(let i=0;i<70;i++)update();assert.equal(mode,'guide');assert.equal(intro,240);assert.equal(menu.hidden,true);
keys.z=true;pressed.x=true;pressed.Enter=true;update();assert.equal(mode,'guide');assert.equal(p.bombs,3);assert.equal(shots.length,0);assert.equal(bullets.length,0);assert.equal(clock,0);hit();assert.equal(p.hp,5);
pressed.Escape=true;update();let time=intro;for(let i=0;i<20;i++)update();assert.equal(intro,time);pressed.Escape=true;update();
while(intro>1)update();assert.equal(mode,'guide');update();assert.equal(mode,'play');assert.equal(stage,1);assert.equal(intro,120);assert.equal(clock,0);assert.equal(bullets.length,0);
for(let i=0;i<121;i++)update();assert.equal(clock,1);assert(m.summons.length>0,'first attack still has a tell');
goTitle();start();for(let i=0;i<70+61;i++)update();pressed.Enter=true;update();assert.equal(mode,'play');assert.equal(intro,120);
beginCard(2);assert.equal(mode,'play');assert.equal(intro,120,'later days do not repeat controls');
let circles=[];const oldCircle=circle;circle=(...a)=>circles.push(a);hitmark(p.x,p.y);circle=oldCircle;assert(circles.some(c=>c[0]===p.x&&c[1]===p.y&&c[2]===2.5&&c[3]===CR));
`);console.log('PASS title -> four-second guide -> Tuesday; protected controls, pause/resume, deliberate skip, later days and exact hit centre.');
