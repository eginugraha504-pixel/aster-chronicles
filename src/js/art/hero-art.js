/* =====================================================================
   REGISTRI SPRITE HERO — dibangun otomatis dari data/heroes.js
   Modul sprite khusus: tambahkan di ART_MODULES (harus punya draw, anims, icon, paintW, strike)
   ===================================================================== */
const ART_MODULES={sakuya:ART_SAKU,raika:ART_RAIKA};
const HERO_ART={};
for(const h of HEROES){if(h.art&&ART_MODULES[h.art])HERO_ART[h.id]=ART_MODULES[h.art];else HERO_ART[h.id]={draw:GEN.build(h.gen||{hair:'bob',weapon:h.wcls,pal:{}}),anims:GEN_ANIMS,strike:.3}}
// sprite hero di frame f, memegang senjata wid (default: senjata terpasang; '__def' = tampilan asli)
const ART_CACHE={};function artFrame(id,f={},wid){if(wid===undefined){const o=typeof S!=='undefined'&&S&&S.heroes&&S.heroes[id];wid=o?(o.wpn||basicWeapon(HD[id].wcls)):null}if(wid==='__def'||!(typeof WD!=='undefined'&&WD[wid]))wid=null;const k=id+(wid||'')+JSON.stringify(f);if(ART_CACHE[k])return ART_CACHE[k];CUR_WPN=wid?WD[wid]:null;let c;try{c=HERO_ART[id].draw(f)}finally{CUR_WPN=null}const w=document.createElement('canvas');w.width=c.width;w.height=c.height;const wg=w.getContext('2d');wg.drawImage(c,0,0);wg.globalCompositeOperation='source-in';wg.fillStyle='#fff';wg.fillRect(0,0,c.width,c.height);return ART_CACHE[k]={c,w,url:c.toDataURL(),dx:f.dx||0,ghost:!!f.ghost}}
const PORT={};function portrait(id){if(PORT[id])return PORT[id];const s=artFrame(id,{},'__def').c,k=s.width/44,c=document.createElement('canvas');c.width=c.height=32*k;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(s,8*k,2*k,32*k,32*k,0,0,32*k,32*k);return PORT[id]=c.toDataURL()}
function animFrame(A,t){let acc=0;for(const a of A){acc+=a.d;if(t<acc)return a.f}return null}
const ANIM_SPD=1.6;
