/* =====================================================================
   STATE PEMAIN — simpan / muat / migrasi save
   ===================================================================== */
let S;
// generasi data simpanan: data lama (sebelum sistem akun, 18 Nov 2026) direset ke 0 saat dibuka
const SAVE_SE=2;
const STARTERS=()=>HEROES.filter(h=>h.starter).map(h=>h.id);
function defState(){
 const heroes={},weapons={};
 for(const id of STARTERS()){const w=basicWeapon(HD[id].wcls);heroes[id]={lv:1,lb:0,wpn:w};if(w)weapons[w]=newWpn()}
 return{gems:START.gems,gold:START.gold,stam:START.stam,stamTs:Date.now(),lv:1,exp:0,name:'Kapten',
  heroes,weapons,gear:{},team:STARTERS().slice(0,4),stages:{},pity:0,wpity:0,hg:false,wg:false,badge:0,shopX:{},bestCP:0,tixH:0,tixW:0,mail:{},ev:{},mats:{},loginDays:0,
  lang:'id',daily:{},ach:{},freeDate:'',auto:true,speed:1,sound:true,welcomed:false,named:false,uid:'',world:0,banner:0,se:SAVE_SE}}
function load(){
 try{const d=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(d&&d.heroes&&d.se===SAVE_SE){S=Object.assign(defState(),d);if(S.weapons&&S.weapons.aurora){delete S.weapons.aurora;S.auroraRefund=1}if(d.named===undefined)S.named=!!d.welcomed;migrate();return}
  if(d&&d.heroes){newGame();if(d.lang)S.lang=d.lang;return}}catch(e){}  // data lama (sebelum akun) -> mulai dari 0, bahasa tetap. named: pemain lama tidak perlu membuat nama lagi
 newGame()}
// pemain baru: fitur terkunci, tutorial & prolog
function newGame(){S=defState();S.unl=[];S.tut=0;S.story={seen:{},pend:null}}
// bersihkan data yang tidak valid (hero/senjata dihapus dari data, kelas tidak cocok, dll)
// hero yang dihapus -> penggantinya (Seraphine diganti Celestine, 18 Nov 2026). Level, LB, ascend & gear ikut pindah.
const HERO_REPLACED={seraphine:'celestine'};
function migrateReplaced(){for(const[o,n]of Object.entries(HERO_REPLACED)){const h=S.heroes[o];if(!h)continue;const c=S.heroes[n];
  if(!c)S.heroes[n]=Object.assign({},h,{wpn:null});else{for(const k of Object.keys(h))if(typeof h[k]==='number'&&k!=='lb'&&(c[k]==null||h[k]>c[k]))c[k]=h[k];c.lb=(c.lb||0)+(h.lb||0)+1;for(const k of Object.keys(h))if(c[k]==null&&h[k]!=null&&k!=='wpn')c[k]=h[k]}
  delete S.heroes[o];S.team=(S.team||[]).map(x=>x===o?n:x);if(S.arena&&S.arena.def)S.arena.def=S.arena.def.map(x=>x===o?n:x);if(S.homeHero===o)S.homeHero=n;S.replacedMsg=S.replacedMsg||{};S.replacedMsg[o]=1}}
function migrate(){
 migrateReplaced();if(S.tut===undefined)S.tut='done';if(typeof featInit==='function')featInit();if(!S.story)S.story={seen:{},pend:null,note:0};
 for(const k in S.heroes)if(!HD[k])delete S.heroes[k];
 if(!S.weapons||typeof S.weapons!=='object')S.weapons={};
 for(const k in S.weapons){if(!WD[baseId(k)]){delete S.weapons[k];continue}invAlias(WD,k);S.weapons[k]=Object.assign(newWpn(),S.weapons[k])}
 if(!S.mats||typeof S.mats!=='object')S.mats={};
 if(!S.gear||typeof S.gear!=='object')S.gear={};for(const k in S.gear){if(!GDD[baseId(k)]){delete S.gear[k];continue}invAlias(GDD,k);S.gear[k]=Object.assign(newGear(),S.gear[k]);S.gear[k].lv=Math.min(GEAR_MAX_LV[GDD[k].r],S.gear[k].lv)}
 for(const sl of['armor','acc']){const k=gKey(sl),u=new Set();for(const h in S.heroes){const g=S.heroes[h][k];if(g&&(!GDD[g]||!S.gear[g]||GDD[g].slot!==sl||u.has(g)))S.heroes[h][k]=null;if(S.heroes[h][k])u.add(S.heroes[h][k])}}
 if(!Object.keys(S.weapons).length)for(const id of STARTERS())if(S.heroes[id]){const w=basicWeapon(HD[id].wcls);if(w){S.weapons[w]=newWpn();if(!S.heroes[id].wpn)S.heroes[id].wpn=w}}
 const used=new Set();
 for(const k in S.heroes){const o=S.heroes[k],w=o.wpn;if(w&&(!WD[w]||!S.weapons[w]||WD[w].cls!==HD[k].wcls||used.has(w)))o.wpn=null;if(o.wpn)used.add(o.wpn);o.lb=Math.min(DUPE_MAX,o.lb||0)}
 S.team=(S.team||[]).slice(0,4).map(x=>HD[x]&&S.heroes[x]?x:null);while(S.team.length<4)S.team.push(null);
 if(!S.team.some(Boolean))S.team=defState().team;
 if(!S.mail||typeof S.mail!=='object')S.mail={};if(!S.shop)S.shop={date:'',bought:{}};if(!S.ev||typeof S.ev!=='object')S.ev={};S.tixH=S.tixH||0;S.tixW=S.tixW||0;S.loginDays=Math.max(1,S.loginDays||0);
 if(S.banner>=BANNERS.length)S.banner=0;if(S.world>=WORLDS.length)S.world=0}
function lsPut(k,v){try{localStorage.setItem(k,v);return true}catch(e){try{localStorage.removeItem('aster_botsum');localStorage.removeItem('aster_botpu');localStorage.setItem(k,v);return true}catch(e2){return false}}}
function save(){lsPut(SAVE_KEY,JSON.stringify(S));if(typeof netMarkDirty==='function')netMarkDirty()}
function checkDaily(){const d=today();if(S.daily.date!==d){S.daily={date:d,c:{summon:0,clear:0,lvup:0,boss:0,dg:0},claimed:{}};S.loginDays=(S.loginDays||0)+1}}
function regen(){const now=Date.now();if(S.stam>=stamMax()){S.stamTs=now;return}const n=Math.floor((now-S.stamTs)/STAM_MS);if(n>0){S.stam=Math.min(stamMax(),S.stam+n);S.stamTs+=n*STAM_MS;if(S.stam>=stamMax())S.stamTs=now}}
const expNeed=lv=>40+lv*25;
// naik level: stamina langsung penuh sesuai batas level baru (kalau sedang di atas batas, tidak dikurangi)
function addExp(x){S.exp+=x;let ups=0;while(S.exp>=expNeed(S.lv)){S.exp-=expNeed(S.lv);S.lv++;ups++}if(ups)S.stam=Math.max(S.stam,stamMax());return ups}
const unlocked=st=>st.n===0||(typeof gmOpt==='function'&&gmOpt('unl'))||!!S.stages[SLIST[st.n-1].key];
const totalStars=()=>Object.values(S.stages).reduce((a,b)=>a+b,0);
const owned=()=>Object.keys(S.heroes).length;
