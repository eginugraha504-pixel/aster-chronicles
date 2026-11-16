/* =====================================================================
   SISTEM SURAT — pengiriman, klaim, hadiah item (tiket, hero, senjata)
   S.mail[id] = {t:waktu terima, read:0|1, claimed:0|1, def?:surat custom}
   ===================================================================== */
const MD={};MAILS.forEach(m=>MD[m.id]=m);
const mailDef=id=>MD[id]||(S.mail[id]&&S.mail[id].def);
// kirim surat yang syaratnya baru terpenuhi; return jumlah surat baru
function deliverMail(){if(!S.mail)S.mail={};let n=0;
 for(const m of MAILS){if(S.mail[m.id])continue;let ok=true;try{ok=!m.cond||m.cond()}catch(e){ok=false}
  if(ok){S.mail[m.id]={t:Date.now(),read:0,claimed:0};n++}}
 if(n)save();return n}
function sendMail(def){if(!S.mail)S.mail={};if(S.mail[def.id])return false;S.mail[def.id]={t:Date.now(),read:0,claimed:0,def};save();return true}
const mailList=()=>Object.keys(S.mail||{}).filter(mailDef).sort((a,b)=>(S.mail[a].claimed-S.mail[b].claimed)||(S.mail[b].t-S.mail[a].t));
const mailHasRw=id=>{const r=mailDef(id).rw;return r&&Object.keys(r).length>0};
const mailPending=()=>mailList().filter(id=>!S.mail[id].claimed&&(mailHasRw(id)||!S.mail[id].read)).length;
// pilihan hadiah 'Pilih 1 hero ★N': hanya hero standar (hero terbatas hanya lewat banner-nya)
const pickPool=r=>HEROES.filter(h=>h.r===r&&!h.limited);
// hadiah item: hero/senjata lewat grantItem (duplikat -> LB/penempaan/permata)
function grantRw(r){const got=[];let ups=0;
 if(r.gems)S.gems+=r.gems;if(r.gold)S.gold+=r.gold;if(r.stam)S.stam+=r.stam;
 if(r.mats)addMats(r.mats);if(r.gear)grantGears(r.gear);if(r.tixH)S.tixH=(S.tixH||0)+r.tixH;if(r.tixW)S.tixW=(S.tixW||0)+r.tixW;
 if(r.hero&&HD[r.hero])got.push({id:r.hero,tag:grantItem({id:r.hero})});
 if(r.weapon&&WD[r.weapon])got.push({wid:r.weapon,tag:grantItem({wid:r.weapon})});
 if(r.exp)ups=addExp(r.exp);return{got,ups}}
function claimMail(id,pick){const o=S.mail[id],d=mailDef(id);if(!o||o.claimed)return null;
 const r=Object.assign({},d.rw||{});if(r.pickHero){if(!pick||!pickPool(r.pickHero).some(h=>h.id===pick))return null;delete r.pickHero;r.hero=pick}
 o.claimed=1;o.read=1;const res=grantRw(r);save();return res}
