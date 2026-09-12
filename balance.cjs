// Repeatable offensive probe, not a claim of human playability.
const {game}=require('./test-support.cjs');
const rows=[];
for(let c=0;c<7;c++)for(const adaptive of[false,true]){
  const g=game();
  const result=g.run(`reset();beginCard(${c});mode='play';intro=0;p.inv=1e8;p.y=350;
    let ticks=0,totalDamage=0;const baseDamage=damage;
    damage=function(n){totalDamage+=n;baseDamage(n)};
    for(;ticks<9000&&mode==='play';ticks++){
      keys.z=true;
      let targets=bullets.filter(b=>b.life>0&&hand.includes(b.k)&&b.y>100&&b.y<p.y-20&&b.x>24&&b.x<W-24);
      let target=targets.sort((a,b)=>(Math.abs(a.x-p.x)+(p.y-a.y)*.7)-(Math.abs(b.x-p.x)+(p.y-b.y)*.7))[0];
      if(${adaptive}&&target&&ticks%12===0&&held()!==target.k)pressed.c=true;
      let tx=${adaptive}&&target?target.x:boss.x;
      keys.ArrowLeft=p.x>tx+4;keys.ArrowRight=p.x<tx-4;
      update();
    }
    ({seconds:Math.round(ticks/6)/10,cleared:mode==='clear'||mode==='win',matchingPercent:Math.round(m.cutDamage/totalDamage*100),broken:m.broken,sources:m.stopped})
  `);
  rows.push({stage:c+1,aim:adaptive?'match nearby colour':'hold one colour',...result});
}
console.table(rows);
if(rows.some(r=>!r.cleared))process.exitCode=1;
