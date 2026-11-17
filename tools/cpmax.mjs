// =====================================================================
// CEK CP MAKSIMAL — tim terbaik bila semua hero/senjata/perlengkapan maks di bintang tertentu.
// Pakai: node tools/cpmax.mjs [bintang=6]     (target desain ★6 ≈ 3.000.000)
// =====================================================================
import fs from 'fs';import vm from 'vm';import path from 'path';import {fileURLToPath} from 'url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),J=f=>fs.readFileSync(path.join(ROOT,'src/js',f),'utf8').replace(/^(const|let) /gm,'var ');
const ctx={T:(s,v)=>s,Math,Object,Array,JSON,Set,Map,console,Date};vm.createContext(ctx);
vm.runInContext(['data/config.js','data/elements.js','data/heroes.js','data/weapons.js','data/gear.js','data/materials.js','data/ascend.js','systems/weapons.js','systems/gear.js','systems/stats.js'].map(J).join('\n'),ctx);
const {HEROES,WEAPONS,GEAR,ASC,LB_LV,WPN_LV_CAP,WPN_LB_MAX}=ctx,STAR=+(process.argv[2]||6);
function build(star){const S={lv:999,heroes:{},weapons:{},gear:{}};ctx.S=S;
 for(const g of GEAR){S.gear[g.id]={lv:ASC.gCap[Math.max(star,g.r)],ref:5,asc:Math.max(star,g.r)}}
 for(const w of WEAPONS){const st=Math.max(star,w.r);S.weapons[w.id]={ref:5,lb:WPN_LB_MAX,lv:WPN_LV_CAP[WPN_LB_MAX]+ASC.wCapAdd[st],exp:0,asc:st}}
 const ar=GEAR.filter(g=>g.slot==='armor').sort((a,b)=>b.r-a.r||b.hp-a.hp)[0].id,ac=GEAR.filter(g=>g.slot==='acc').sort((a,b)=>b.r-a.r||b.atk-a.atk)[0].id;
 for(const h of HEROES){const st=Math.max(star,h.r);const sig=WEAPONS.find(w=>w.owner===h.id),best=WEAPONS.filter(w=>w.cls===h.wcls).sort((a,b)=>b.atk-a.atk)[0];
  S.heroes[h.id]={lv:ASC.heroCap[st]+5*LB_LV,lb:5,asc:st,wpn:(sig||best).id,ar,ac}}return S}
function bestTeam(){const ids=HEROES.map(h=>h.id);let bv=0,bt=null;
 for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)for(let c=b+1;c<ids.length;c++)for(let d=c+1;d<ids.length;d++){const t=[ids[a],ids[b],ids[c],ids[d]],v=ctx.teamCP(t).total;if(v>bv){bv=v;bt=t}}return{bv,bt}}
for(const st of[3,4,5,6]){build(st);const r=bestTeam();const per=r.bt.map(id=>id+':'+ctx.heroPow(id));console.log(`★${st}  CP tim maks ${r.bv.toLocaleString('id-ID')}  ${per.join(' ')}`)}
