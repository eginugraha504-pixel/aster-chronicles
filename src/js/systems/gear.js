/* =====================================================================
   PELINDUNG & AKSESORI — enhance (+N) pakai emas & bijih, penempaan dari duplikat
   S.gear[id] = {lv, ref}      hero: S.heroes[h].ar (pelindung), .ac (aksesori)
   ===================================================================== */
const newGear=()=>({lv:0,ref:0});
const gKey=slot=>slot==='armor'?'ar':'ac';
function gearOf(hid,slot){const o=S.heroes[hid],g=o&&o[gKey(slot)];return g&&GDD[g]&&S.gear[g]?GDD[g]:null}
const gearHolder=gid=>Object.keys(S.heroes).find(h=>S.heroes[h][gKey(GDD[gid].slot)]===gid);
// stat item pada level/penempaan tertentu
function gearStats(gid,lv){const g=GDD[gid],o=S.gear[gid]||newGear();if(lv==null)lv=o.lv;const k=(1+GEAR_GROWTH*lv)*(1+WPN_REFINE*o.ref),kc=(1+GEAR_CRIT_GROWTH*lv)*(1+WPN_REFINE*o.ref);
 return g.slot==='armor'?{hp:Math.round(g.hp*k),def:Math.round(g.def*k)}:{atk:Math.round(g.atk*k),crit:Math.round(g.crit*kc*10)/10}}
const gearMax=gid=>GEAR_MAX_LV[GDD[gid].r];
function gearUpCost(gid){const g=GDD[gid],lv=S.gear[gid].lv;if(lv>=gearMax(gid))return null;
 const c={gold:GEAR_UP_GOLD[g.r]*(lv+1),ore1:lv+1};if(g.r>=2&&lv>=3)c.ore2=Math.floor(lv/3);if(g.r>=3&&lv>=5)c.ore3=Math.floor(lv/5);return c}
const hasCost=c=>Object.entries(c).every(([k,v])=>k==='gold'?S.gold>=v:(S.mats[k]||0)>=v);
function doGearUp(gid){const c=gearUpCost(gid);if(!c||!hasCost(c))return false;for(const[k,v]of Object.entries(c)){if(k==='gold')S.gold-=v;else S.mats[k]-=v}S.gear[gid].lv++;return true}
// item baru / duplikat -> salinan baru (penempaan manual, lihat SALINAN di systems/weapons.js)
const gScore=k=>{const o=S.gear[k];return(gearHolder(k)?1e6:0)+o.ref*1e4+o.lv};
function addGearCopy(gid){const k=invNewKey(S.gear,gid);S.gear[k]=newGear();invAlias(GDD,k);return k}
function grantGear(gid){if(!GDD[gid])return null;const had=invHas(S.gear,gid);addGearCopy(gid);return had?'copy':'new'}
const gFodder=k=>invKeys(S.gear,baseId(k)).filter(x=>x!==k&&!gearHolder(x)).sort((a,b)=>gScore(a)-gScore(b));
function refineGear(k){const o=S.gear[k],f=gFodder(k)[0];if(!o||!f||o.ref>=DUPE_MAX)return null;delete S.gear[f];o.ref++;return f}
function salvageGear(k){if(!S.gear[k]||gearHolder(k))return null;const m=SALVAGE[GDD[k].r];delete S.gear[k];addMats(m);return m}
function salvageSpareG(r){const tot={};let n=0;for(const g of GEAR){if(g.r!==r)continue;const ks=invKeys(S.gear,g.id).sort((a,b)=>gScore(b)-gScore(a));for(const k of ks.slice(1)){if(gearHolder(k)||S.gear[k].ref||S.gear[k].lv)continue;const m=salvageGear(k);if(m){n++;for(const x in m)tot[x]=(tot[x]||0)+m[x]}}}return{n,tot}}
function grantGears(list){return[].concat(list||[]).filter(Boolean).map(gid=>({gid,tag:grantGear(gid)}))}
// peluang drop dari tingkat dungeon
function rollGear(st){const slot=DG_GEAR[st.dg],p=DG_GEAR_P[st.lvl];if(!slot||!p||Math.random()>=p[0])return null;
 let x=Math.random()*(p[1]+p[2]+p[3]),r=1;for(r=1;r<3;r++){if(x<p[r])break;x-=p[r]}const pool=GEAR.filter(g=>g.slot===slot&&g.r===r);return pool.length?pool[Math.floor(Math.random()*pool.length)].id:null}
function equipGear(hid,gid){const slot=GDD[gid].slot,k=gKey(slot);for(const h in S.heroes)if(S.heroes[h][k]===gid)S.heroes[h][k]=null;S.heroes[hid][k]=gid}
