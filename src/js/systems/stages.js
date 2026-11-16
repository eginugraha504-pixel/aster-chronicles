/* Generator tahap dari WORLDS (gelombang, hadiah, CP disarankan) */
const STAGES={},SLIST=[];
WORLDS.forEach((w,wi)=>{for(let s=0;s<5;s++){const n=wi*5+s,key=(wi+1)+'-'+(s+1),boss=s===4,rng=mulberry(n*977+13),waves=[],nw=boss?3:2;
 for(let k=0;k<nw;k++){if(boss&&k===nw-1){waves.push([{t:w.boss,boss:true,el:w.bossEl},{t:w.mobs[2],el:w.els[0]}]);continue}
  const cnt=Math.min(4,2+(s>=2?1:0)+(k>0?1:0)),wave=[];for(let j=0;j<cnt;j++)wave.push({t:w.mobs[Math.floor(rng()*w.mobs.length)],el:w.els[Math.floor(rng()*w.els.length)]});waves.push(wave)}
 const st={key,wi,s,n,name:w.stages[s],boss,waves,cost:boss?STAGE_RW.cost[1]:STAGE_RW.cost[0],gold:Math.round(STAGE_RW.gold[0]+STAGE_RW.gold[1]*n),gems:boss?STAGE_RW.gems[1]:STAGE_RW.gems[0],exp:STAGE_RW.exp[0]+STAGE_RW.exp[1]*n,bg:w.bg,art:w.art,rec:recCP(n)};STAGES[key]=st;SLIST.push(st)}});
