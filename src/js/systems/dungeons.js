/* =====================================================================
   SISTEM DUNGEON — tahap dibuat dari data/dungeons.js, drop material, sapu (sweep)
   kunci tahap: '<dungeon>-<tingkat>' mis. 'mine-1'
   ===================================================================== */
const ROMAN=['I','II','III','IV','V','VI','VII'];
const DG_STAGES=[];
DUNGEONS.forEach(d=>d.levels.forEach((L,i)=>{const key=d.id+'-'+(i+1),n=L.n,rng=mulberry(n*331+i*17+d.id.length),waves=[];
 for(let k=0;k<2;k++){const cnt=Math.min(4,2+k+(i>=2?1:0)),w=[];for(let j=0;j<cnt;j++)w.push({t:d.mobs[Math.floor(rng()*d.mobs.length)],el:d.els[Math.floor(rng()*d.els.length)]});waves.push(w)}
 waves.push([{t:d.boss,boss:true,el:d.bossEl},{t:d.mobs[0],el:d.els[0]}]);
 const st={key,dg:d.id,lvl:i,n,s:4,wi:-1,boss:true,waves,cost:L.cost,gold:Math.round(300+120*n),goldR:L.gold||null,exp:8+3*n,bg:d.bg,art:d.art,drop:L.drop,req:L.req,
  rec:recCP(n)};
 Object.defineProperty(st,'name',{get:()=>DGD[st.dg].n+' '+ROMAN[st.lvl],enumerable:true});
 STAGES[key]=st;DG_STAGES.push(st)}));
const dgUnlocked=st=>!st.req||!!S.stages[st.req];
// emas dungeon emas: acak dalam rentang, +25% bila 3 bintang
const dgGold=(st,sr)=>st.goldR?Math.round((st.goldR[0]+Math.random()*(st.goldR[1]-st.goldR[0]))*(sr>=3?1+GOLD_DG_3STAR:1)/10)*10:st.gold;
function rollDrops(st,bonus){const m={};for(const[k,[a,b]]of Object.entries(st.drop)){let n=a+Math.floor(Math.random()*(b-a+1));if(bonus&&Math.random()<.3)n++;if(n>0)m[k]=n}return m}
const addMats=m=>{for(const k in m)S.mats[k]=(S.mats[k]||0)+m[k]};
// sapu: hanya untuk tingkat yang sudah diselesaikan
function sweepDg(key,times){const st=STAGES[key];if(!S.stages[key])return{err:T('Selesaikan tingkat ini sekali dulu untuk membuka Sapu.')};regen();
 if(S.stam<st.cost*times)return{err:T('Stamina tidak cukup!')};S.stam-=st.cost*times;
 const tot={gold:0,exp:0,mats:{},gear:[]};for(let i=0;i<times;i++){const gd=rollGear(st);if(gd)tot.gear.push(gd);const d=rollDrops(st,S.stages[key]>=3);for(const k in d)tot.mats[k]=(tot.mats[k]||0)+d[k];tot.gold+=dgGold(st,S.stages[key]);tot.exp+=st.exp}
 addMats(tot.mats);grantGears(tot.gear);const ups=grant({gold:tot.gold,exp:tot.exp});S.daily.c.dg=(S.daily.c.dg||0)+times;S.daily.c.clear+=times;evCount('clear',times);save();return{rw:tot,ups}}
