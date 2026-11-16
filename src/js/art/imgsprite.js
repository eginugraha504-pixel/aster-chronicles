/* =====================================================================
   SPRITE ILUSTRASI (Higgsfield) — strip 8 frame 88×88 per karakter, digambar ke ukuran logis 44×44
   frame: 0 idle | 1 napas | 2 jalan A | 3 jalan B | 4 ancang-ancang | 5 serang | 6 kena hit | 7 skill
   SPRITE_SRC['h_<id>'] / ['e_<tipe>'] disuntik build.py. Karakter tanpa gambar tetap memakai sprite kode.
   ===================================================================== */
const SPR_FW=88,SPR_IMG={},SPR_FR={};
// muat semua strip SEKALI; frame yang terlanjur digambar dengan sprite lama (sebelum siap) dibuang dari cache
let SPR_P=null;
function sprReady(){if(typeof SPRITE_SRC==='undefined')return Promise.resolve();if(SPR_P)return SPR_P;
 SPR_P=Promise.all(Object.keys(SPRITE_SRC).map(k=>{const im=new Image();im.src=SPRITE_SRC[k];SPR_IMG[k]=im;return(im.decode?im.decode():new Promise(r=>{im.onload=r;im.onerror=r})).catch(()=>{})}))
  .then(()=>{for(const k in ART_CACHE)if(ART_CACHE[k].c.width!==SPR_FW&&HERO_ART[k.match(/^[a-z]+/)[0]]&&HERO_ART[k.match(/^[a-z]+/)[0]].img)delete ART_CACHE[k];
   for(const id in PORT)if(HERO_ART[id]&&HERO_ART[id].img)delete PORT[id];
   if(typeof ECACHE!=='undefined')for(const k in ECACHE)if(ECACHE[k].c.width!==SPR_FW&&hasSpr('e_'+k.split('|')[0]))delete ECACHE[k]});
 return SPR_P}
const sprOK=key=>{const im=SPR_IMG[key];return !!(im&&im.complete&&im.naturalWidth)}
// pemetaan parameter frame lama (pose/legs/bdy) -> indeks frame strip
function sprIdx(f){const p=f.pose;
 if(p==='back'||p==='aim'||p==='iai')return 4;if(p==='slash'||p==='follow')return 5;if(p==='hit')return 6;if(p==='raise'||p==='pray')return 7;
 if(f.legs)return(f.legs==='w1'||f.legs==='w3')?3:2;if(f.face==='hurt')return 6;return f.bdy?1:0}
function sprCanvas(key,i){const k=key+'#'+i;if(SPR_FR[k])return SPR_FR[k];const im=SPR_IMG[key];if(!im||!im.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=c.height=SPR_FW;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,i*SPR_FW,0,SPR_FW,SPR_FW,0,0,SPR_FW,SPR_FW);return SPR_FR[k]=c}
const IMG_ANIMS={
 idle:[{d:520,f:{}},{d:520,f:{bdy:1}}],
 walk:[{d:170,f:{legs:'w0'}},{d:170,f:{legs:'w1'}}],
 attack:[{d:240,f:{pose:'back'}},{d:300,f:{pose:'slash',lean:1}},{d:140,f:{pose:'slash'}}],
 hit:[{d:380,f:{pose:'hit'}},{d:160,f:{bdy:1}}],
 skill:[{d:260,f:{pose:'back'}},{d:520,f:{pose:'raise'}},{d:240,f:{pose:'slash'}}]};
function hasSpr(key){return typeof SPRITE_SRC!=='undefined'&&!!SPRITE_SRC[key]}
// ganti modul hero yang punya strip gambar
for(const h of HEROES)if(hasSpr('h_'+h.id)){const key='h_'+h.id,old=HERO_ART[h.id];
 HERO_ART[h.id]={img:true,anims:IMG_ANIMS,strike:.36,icon:old&&old.icon,paintW:null,
  draw:f=>sprCanvas(key,sprIdx(f||{}))||old.draw(f||{})}}

sprReady();   // mulai muat secepatnya (sebelum layar judul)
