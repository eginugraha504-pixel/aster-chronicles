/* =====================================================================
   GACHA — roll, pity, duplikat (Limit Break / Penempaan)
   Peluang & harga diatur di data/config.js, banner di data/banners.js
   ===================================================================== */
// hero terbatas (limited) hanya muncul lewat rate-up banner miliknya sendiri
WEAPONS.forEach(w=>{if(w.owner&&HD[w.owner]&&HD[w.owner].limited)w.limited=true});   // signature hero terbatas = senjata terbatas
const bannerPool=(b,r)=>(b.weapon?WEAPONS:HEROES).filter(h=>h.r===r&&(!h.limited||h.id===b.rateUp));
const itemR=r=>r.wid?WD[r.wid].r:HD[r.id].r;
/* ---- INTI GACHA (dipakai pemain & bot — satu-satunya tempat aturan peluang) ----
   st   : {pity, g}  pity = tarikan sejak ★3 terakhir, g = jaminan rate-up aktif
   up   : id item rate-up (null = banner standar)
   pool : r => daftar id kandidat bintang r      rng: fungsi acak 0..1
   hasil: {r, id, on}  on = true (Rate On) | false (Rate Off) | null (bukan ★3 / tanpa rate-up) */
// peluang ★3 (%) untuk tarikan ke-k sejak ★3 terakhir (termasuk soft pity)
const rate3At=k=>k>=PITY?100:RATES[3]+Math.max(0,k-SOFT_PITY.at+1)*SOFT_PITY.step;
function gachaRoll(st,up,pool,rng,force2,isW){st.pity++;const x=rng()*100,p3=rate3At(st.pity);
 const r=x<p3?3:(x<p3+RATES[2]||force2)?2:1;let id=null,on=null;
 if(r===3){st.pity=0;if(up){on=!!st.g||rng()<RATE_UP[isW?'wpn':'hero'];st.g=!on;if(on)id=up}}
 if(!id){const P=pool(r),c=up&&r===3?P.filter(k=>k!==up):P;id=c.length?c[Math.floor(rng()*c.length)]:up;if(id===up&&r===3&&up){on=true;st.g=false}}
 return{r,id,on}}
const gKeyOf=b=>b.weapon?['wpity','wg']:['pity','hg'];
function rollOne(b,force2){const[pk,gk]=gKeyOf(b),st={pity:S[pk],g:!!S[gk]};
 const o=gachaRoll(st,b.rateUp,r=>bannerPool(b,r).map(x=>x.id),Math.random,force2,!!b.weapon);S[pk]=st.pity;S[gk]=st.g;
 return b.weapon?{wid:o.id,on:o.on}:{id:o.id,on:o.on}}
// status jaminan banner b (untuk UI): true = ★3 berikutnya pasti rate-up
// peluang ★3 efektif termasuk hard pity (analitik): n = rata-rata summon per ★3
function gachaEffRate(){let surv=1,n=0;for(let k=1;k<=PITY;k++){n+=surv;surv*=1-Math.min(100,rate3At(k))/100}return{n,p:100/n}}
const rateGuar=b=>!!(b.rateUp&&S[gKeyOf(b)[1]]);
// beri item ke pemain; tag: new | lb (naik LB/penempaan) | gm:<permata>
function grantItem(it){
 if(it.wid){const had=invHas(S.weapons,it.wid);it.key=addWpnCopy(it.wid);const ow=WD[it.wid].owner;if(ow&&S.heroes[ow])autoFillWpn(ow);return had?'copy':'new'}   // senjata duplikat -> salinan baru
 const o=S.heroes[it.id];if(!o){S.heroes[it.id]={lv:1,lb:0,wpn:null};autoFillWpn(it.id);return'new'}if(o.lb<DUPE_MAX){o.lb++;return'lb'}const c=BADGE_DUPE[HD[it.id].r];S.badge=(S.badge||0)+c;return'lc:'+c}   // hero lewat LB maks -> Lencana Ksatria
function pullItems(b,n){const res=[];for(let i=0;i<n;i++){const force=n===10&&i===9&&!res.some(r=>itemR(r)>=2);const it=rollOne(b,force);res.push({...it,tag:grantItem(it)})}return res}
