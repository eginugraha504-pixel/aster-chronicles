/* =====================================================================
   SISTEM KEBANGKITAN (Ascension) — data: data/ascend.js · tampilan: ui/ascend.js
   kind: 'hero' (kunci = id hero) · 'wpn' (kunci inventaris senjata) · 'gear' (kunci inventaris perlengkapan)
   Naik satu bintang: level mentok di bintang sekarang (+ Limit Break senjata maks) → bayar bahan → .asc+1.
   Level tidak direset: batas level baru langsung terbuka di atasnya.
   ===================================================================== */
const ascStar=(kind,k)=>kind==='hero'?heroStar(k):kind==='wpn'?wStar(k):gStar(k);
const ascObj=(kind,k)=>kind==='hero'?S.heroes[k]:kind==='wpn'?S.weapons[k]:S.gear[k];
const ascCost=(kind,k)=>{const s=ascStar(kind,k);return s>=ASC.maxStar?null:ASC.cost[kind][s+1]};
// syarat sebelum boleh bangkit; mengembalikan daftar {ok,t} untuk ditampilkan
function ascReqs(kind,k){const o=ascObj(kind,k),R=[];if(!o)return R;
 if(kind==='hero'){const cap=maxLvRaw(k);R.push({ok:o.lv>=cap,t:T('Level {a}/{b}',{a:o.lv,b:cap})});
  if(cap>HERO_LV_BY_ACC(S.lv))R.push({ok:false,t:T('Level Akun {n} (batas level hero)',{n:Math.ceil((cap-10)/2)})})}
 else if(kind==='wpn'){const lb=o.lb||0;R.push({ok:lb>=WPN_LB_MAX,t:T('Limit Break {a}/{b}',{a:lb,b:WPN_LB_MAX})});R.push({ok:o.lv>=wMaxLv(k),t:T('Level {a}/{b}',{a:o.lv,b:wMaxLv(k)})})}
 else R.push({ok:(o.lv||0)>=gearMax(k),t:T('Tempa +{a}/+{b}',{a:o.lv||0,b:gearMax(k)})});
 return R}
const ascHave=id=>id==='gold'?S.gold:id==='badge'?(S.badge||0):(S.mats[id]||0);
function ascCan(kind,k){const c=ascCost(kind,k);if(!c)return{err:T('Sudah ★6, bintang tertinggi!')};
 const bad=ascReqs(kind,k).find(r=>!r.ok);if(bad)return{err:bad.t};
 for(const id in c)if(ascHave(id)<c[id])return{err:T('Bahan kurang: {n}',{n:id==='gold'?T('Emas'):MD2[id].n})};return{ok:1,c}}
function doAscend(kind,k){const r=ascCan(kind,k);if(r.err)return r;const o=ascObj(kind,k),from=ascStar(kind,k);
 for(const id in r.c){if(id==='gold')S.gold-=r.c[id];else if(id==='badge')S.badge-=r.c[id];else S.mats[id]-=r.c[id]}
 o.asc=from+1;S.ascLog=(S.ascLog||0)+1;if(typeof evCount==='function')evCount('ascend');
 if(typeof chatAct==='function')chatAct(T('membangkitkan {n} ke ★{s}',{n:kind==='hero'?HD[k].name:kind==='wpn'?WD[k].name:GDD[k].name,s:o.asc}));
 if(typeof teamPow==='function')S.bestCP=Math.max(S.bestCP||0,teamPow());save();return{ok:1,from,to:o.asc}}
// titik merah: ada sesuatu di tim yang bisa dibangkitkan sekarang
function ascReadyAny(){for(const id of S.team.filter(Boolean)){if(ascCan('hero',id).ok)return true;const h=S.heroes[id];
 if(h.wpn&&S.weapons[h.wpn]&&ascCan('wpn',h.wpn).ok)return true;for(const g of[h.ar,h.ac])if(g&&S.gear[g]&&ascCan('gear',g).ok)return true}return false}
