/* =====================================================================
   PASANG OTOMATIS & TUNGKU PELEBURAN  (tampilan: ui/smelt.js)
   ---------------------------------------------------------------------
   PASANG OTOMATIS: untuk tiap hero di tim (yang terkuat dulu) dicoba setiap senjata/pelindung/
   aksesori yang tersedia, lalu dipilih yang membuat CP hero itu PALING tinggi (memakai rumus CP
   asli, jadi bonus signature, level, Limit Break, dan penempaan ikut terhitung). Barang yang dipakai
   hero cadangan (di luar tim) boleh diambil; barang hero tim lain tidak.
   Jalan otomatis setelah dapat senjata/perlengkapan baru (bisa dimatikan: S.autoEq = false).
   PELEBURAN: salinan cadangan dilebur jadi bijih, emas, dan material Limit Break. Barang yang
   pernah ditingkatkan mengembalikan sebagian biayanya. Salinan terbaik tiap jenis & yang sedang
   dipakai tidak pernah dilebur. Lebur otomatis setelah dapat barang: S.autoSalv (0 mati, 1 = ★1, 2 = ★1–★2).
   ===================================================================== */
const SMELT={
 // hasil dasar 1 salinan per bintang
 base:{1:{gold:1000,mats:{ore1:4}},2:{gold:3000,mats:{ore1:2,ore2:2,gem1:1}},3:{gold:8000,mats:{ore2:2,ore3:2,gem2:1}}},
 matBack:.8,goldBack:.5,      // pengembalian material & emas yang pernah dipakai untuk meningkatkan
 refBack:.5,                  // tiap penempaan (+1) = setengah hasil dasar lagi
 autoSalvDefault:1,           // lebur otomatis bawaan: salinan ★1
};
const smKind=k=>WD[k]&&S.weapons[k]?'w':'g';
// ubah EXP senjata jadi bijih (yang terbesar dulu)
function smOres(exp,m){for(const id of['ore3','ore2','ore1']){const v=MD2[id].exp,n=Math.floor(exp/v);if(n){m[id]=(m[id]||0)+n;exp-=n*v}}}
function smeltYield(kind,k){const isW=kind==='w',o=isW?S.weapons[k]:S.gear[k],r=(isW?WD:GDD)[k].r,B=SMELT.base[r],m={};let gold=B.gold;
 const add=(x,n)=>{n=Math.floor(n);if(n>0)m[x]=(m[x]||0)+n};if(r>=3)for(const x in ASC.smelt3)add(x,ASC.smelt3[x]);for(const x in B.mats)add(x,B.mats[x]*(1+SMELT.refBack*(o.ref||0)));gold*=1+SMELT.refBack*(o.ref||0);
 if(isW){let exp=o.exp||0;const rs=o.asc||r;for(let l=1;l<o.lv;l++)exp+=wExpNeed(l,rs);if(exp){smOres(exp*SMELT.matBack,m);gold+=exp*WPN_EXP_GOLD*SMELT.goldBack}
  for(let s=0;s<(o.lb||0);s++){const c=WPN_LB_COST[r][s];for(const x in c)x==='gold'?gold+=c[x]*SMELT.goldBack:add(x,c[x]*SMELT.matBack)}}
 else for(let l=0;l<(o.lv||0);l++){gold+=GEAR_UP_GOLD[r]*(l+1)*SMELT.goldBack;add('ore1',(l+1)*SMELT.matBack);if(r>=2&&l>=3)add('ore2',Math.floor(l/3)*SMELT.matBack);if(r>=3&&l>=5)add('ore3',Math.floor(l/5)*SMELT.matBack)}
 return{gold:Math.round(gold/10)*10,mats:m}}
const smUpgraded=(kind,k)=>{const o=kind==='w'?S.weapons[k]:S.gear[k];return!!(o.ref||o.lb||(kind==='w'?o.lv>1:o.lv))};
// daftar barang yang boleh dilebur: bukan salinan terbaik jenisnya, tidak dipakai siapa pun
function smeltJunk(o={}){const R=o.r||{1:1,2:1},out=[];
 for(const[kind,L,st,sc,hold]of[['w',WEAPONS,S.weapons,wScore,wHolder],['g',GEAR,S.gear,gScore,gearHolder]]){if(o.kinds&&!o.kinds[kind])continue;
  for(const x of L){if(!R[x.r])continue;const ks=invKeys(st,x.id).sort((a,b)=>sc(b)-sc(a));
   for(const k of ks.slice(1)){if(hold(k)||st[k].asc)continue;if(!o.upgraded&&smUpgraded(kind,k))continue;out.push({kind,k})}}}
 return out}
function smeltSum(list){const t={gold:0,mats:{}};for(const it of list){const y=smeltYield(it.kind,it.k);t.gold+=y.gold;for(const x in y.mats)t.mats[x]=(t.mats[x]||0)+y.mats[x]}return t}
function smeltDo(list){const t={gold:0,mats:{}},done=[];for(const it of list){const st=it.kind==='w'?S.weapons:S.gear,hold=it.kind==='w'?wHolder:gearHolder;if(!st[it.k]||hold(it.k)||st[it.k].asc)continue;
  const y=smeltYield(it.kind,it.k);delete st[it.k];t.gold+=y.gold;for(const x in y.mats)t.mats[x]=(t.mats[x]||0)+y.mats[x];done.push(it)}
 S.gold+=t.gold;addMats(t.mats);S.smelted=(S.smelted||0)+done.length;return{n:done.length,...t}}
const smTxt=t=>[t.gold?fmt(t.gold)+' '+T('emas'):'',...Object.entries(t.mats).map(([x,n])=>MD2[x].n+' ×'+n)].filter(Boolean).join(', ');

/* ---------------- pasang otomatis ---------------- */
const EQS={wpn:{all:()=>Object.keys(S.weapons),ok:(hid,k)=>WD[k]&&WD[k].cls===HD[hid].wcls,holder:wHolder,best:(id)=>invBest(S.weapons,id,wScore),base:baseId},
 ar:{all:()=>Object.keys(S.gear).filter(k=>GDD[k]&&GDD[k].slot==='armor'),ok:()=>1,holder:gearHolder},ac:{all:()=>Object.keys(S.gear).filter(k=>GDD[k]&&GDD[k].slot==='acc'),ok:()=>1,holder:gearHolder}};
// CP hero bila slot diisi k (sementara)
function powWith(hid,slot,k){const o=S.heroes[hid],old=o[slot];o[slot]=k;let p=0;try{p=heroPow(hid)}finally{o[slot]=old}return p}
function setSlot(hid,slot,k){for(const h in S.heroes)if(S.heroes[h][slot]===k)S.heroes[h][slot]=null;S.heroes[hid][slot]=k}
// lock = hero yang barangnya tidak boleh diambil
function autoEquipOne(hid,lock){const ch=[];for(const slot of['wpn','ar','ac']){const E=EQS[slot],o=S.heroes[hid];let best=o[slot]||null,bp=heroPow(hid);
  for(const k of E.all()){if(k===o[slot]||!E.ok(hid,k))continue;const h=E.holder(k);if(h&&h!==hid&&lock.has(h))continue;const p=powWith(hid,slot,k);if(p>bp+.5){bp=p;best=k}}
  if(best&&best!==o[slot]){const from=E.holder(best);setSlot(hid,slot,best);ch.push({hid,slot,k:best,from})}}return ch}
function autoEquipTeam(){const team=S.team.filter(Boolean).sort((a,b)=>heroPow(b)-heroPow(a)),lock=new Set(),ch=[];
 const before=teamPow();for(const hid of team){ch.push(...autoEquipOne(hid,lock));lock.add(hid)}return{ch,before,after:teamPow()}}
function autoEquipHero(hid){const lock=new Set(S.team.filter(h=>h&&h!==hid));const b=heroPow(hid),ch=autoEquipOne(hid,lock);return{ch,before:b,after:heroPow(hid)}}

/* ---------------- setelah dapat barang baru ---------------- */
function invAfterGain(silent){const msg=[];
 if(S.autoEq!==false&&S.team.some(Boolean)){const r=autoEquipTeam();if(r.ch.length)msg.push(T('{n} perlengkapan lebih kuat dipasang otomatis (CP {a} → {b})',{n:r.ch.length,a:fmt(r.before),b:fmt(r.after)}))}
 const lv=S.autoSalv==null?SMELT.autoSalvDefault:S.autoSalv;if(lv>0){const R={1:1};if(lv>=2)R[2]=1;const L=smeltJunk({r:R});if(L.length){const t=smeltDo(L);msg.push(T('{n} salinan dilebur otomatis: {m}',{n:t.n,m:smTxt(t)}))}}
 if(msg.length){save();if(!silent)setTimeout(()=>msg.forEach((m,i)=>setTimeout(()=>toast(m),i*2400)),600)}return msg}
// kait: setelah summon & setelah hadiah berisi senjata/perlengkapan
if(typeof pullItems==='function'){const _p=pullItems;pullItems=function(b,n){const res=_p(b,n);try{if(res.some(it=>it.wid))setTimeout(()=>invAfterGain(),50)}catch(e){}return res}}
