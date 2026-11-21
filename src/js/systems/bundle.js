/* =====================================================================
   PAKET (bundle) & BELI EMAS DENGAN PERMATA — mikrotransaksi gaya game P2W
   Data: TOPUP_CFG.bundles / .fund / .gold (data/topup.js) · tampilan: ui/bundle.js
   S.iap.bun = {bought:{sku:[waktu,...]}, offers:{sku:berlakuSampai|0}, gf:{claimed:{lv:1}}, gold:{d:hariWIB,n:kali}}
   Pembayaran memakai pesanan top up biasa (systems/topup.js): tuSku() mengenali SKU paket, tuDeliver() memanggil bunDeliver().
   ===================================================================== */
const BUN=()=>TOPUP_CFG.bundles||[];
const bunDef=sku=>BUN().find(b=>b.id===sku);
function bunState(){const I=tuState();if(!I.bun||typeof I.bun!=='object')I.bun={};const B=I.bun;
 B.bought=B.bought||{};B.offers=B.offers||{};B.gf=B.gf||{};B.gf.claimed=B.gf.claimed||{};B.gold=B.gold||{d:-1,n:0};return B}
// periode WIB: minggu mulai Senin 00:00, bulan kalender
const bunWk=t=>Math.floor((wibDay(t)+3)/7),bunMo=t=>{const d=new Date(t+BOT_CFG.TZ*36e5);return d.getUTCFullYear()*12+d.getUTCMonth()};
function bunLeft(b,now=Date.now()){const B=bunState(),L=B.bought[b.id]||[];
 if(b.lim==='once'||b.lim==='offer')return L.length?0:1;
 if(b.lim==='week')return L.some(t=>bunWk(t)===bunWk(now))?0:1;
 if(b.lim==='month')return L.some(t=>bunMo(t)===bunMo(now))?0:1;return 1}
// boleh dibeli sekarang? (level cukup, belum habis, penawaran masih berlaku)
function bunAvail(b,now=Date.now()){if(!b||bunLeft(b,now)<=0)return false;if(b.minLv&&S.lv<b.minLv)return false;if(b.lim==='offer')return(bunState().offers[b.id]||0)>now;return true}
const bunOfferLeft=(b,now=Date.now())=>Math.max(0,(bunState().offers[b.id]||0)-now);
// penawaran naik level: terbuka saat level tercapai, berlaku TOPUP_CFG.offerHours jam. Akun yang sudah jauh melewati beberapa level
// sekaligus hanya mendapat penawaran level tertinggi (tidak dibanjiri). Mengembalikan penawaran baru (untuk pop-up) atau null.
function bunOffers(now=Date.now()){if(!S||!S.welcomed)return null;const B=bunState(),L=BUN().filter(b=>b.lim==='offer'&&S.lv>=b.lv&&B.offers[b.id]==null);if(!L.length)return null;
 const top=L[L.length-1];for(const b of L)B.offers[b.id]=b===top?now+TOPUP_CFG.offerHours*36e5:0;save();return top}
const bunActiveOffers=(now=Date.now())=>BUN().filter(b=>b.lim==='offer'&&bunAvail(b,now));
// isi paket (format rw) -> masuk ke akun. pickHero dikirim lewat Kotak Surat (pemain memilih sendiri)
function bunGrant(rw){if(rw.gems)S.gems+=rw.gems;if(rw.gold)S.gold+=rw.gold;if(rw.stam)S.stam+=rw.stam;if(rw.tixH)S.tixH=(S.tixH||0)+rw.tixH;if(rw.tixW)S.tixW=(S.tixW||0)+rw.tixW;
 if(rw.badge)S.badge=(S.badge||0)+rw.badge;if(rw.mats)addMats(rw.mats)}
function bunDeliver(sku){const b=bunDef(sku),B=bunState(),now=Date.now();(B.bought[sku]=B.bought[sku]||[]).push(now);B.bought[sku]=B.bought[sku].slice(-12);
 if(b.fund){save();return{fund:1,rw:{}}}
 const rw=Object.assign({},b.rw),pick=rw.pickHero;delete rw.pickHero;bunGrant(rw);
 if(pick)sendMail({id:'bun_'+sku+'_'+now,from:TOPUP_CFG.merchant,title:T('{n}: pilih 1 hero ★{s}',{n:T(b.n),s:pick}),body:T('Bagian dari {n}. Pilih hero ★{s} yang kamu mau.',{n:T(b.n),s:pick}),rw:{pickHero:pick}});
 if(typeof chatAct==='function')chatAct(T('membeli {n}',{n:T(b.n)}));save();return{rw:b.rw}}
// Dana Pertumbuhan
const bunFundOwned=()=>(bunState().bought.gf||[]).length>0;
const bunFundList=()=>{const F=TOPUP_CFG.fund,B=bunState();return F.lv.map((lv,k)=>({lv,gems:F.gems[k],got:!!B.gf.claimed[lv],ok:S.lv>=lv}))};
const bunFundReady=()=>bunFundOwned()?bunFundList().filter(x=>x.ok&&!x.got):[];
function bunFundClaim(){const L=bunFundReady();if(!L.length)return 0;const B=bunState();let g=0;for(const x of L){B.gf.claimed[x.lv]=1;g+=x.gems}S.gems+=g;save();return g}
// ---- beli emas dengan permata: maks per hari, harga naik tiap kali, kadang kritis ×2/×3 ----
function goldInfo(now=Date.now()){const G=TOPUP_CFG.gold,B=bunState(),d=wibDay(now);if(B.gold.d!==d)B.gold={d,n:0};const n=B.gold.n;
 return{n,left:Math.max(0,G.daily-n),cost:n<G.daily?G.cost[Math.min(n,G.cost.length-1)]:0,gold:G.base+G.perLv*S.lv}}
function goldBuy(){const G=TOPUP_CFG.gold,i=goldInfo();if(i.left<=0)return{err:T('Batas beli emas hari ini habis. Besok lagi!')};if(S.gems<i.cost)return{err:T('Permata tidak cukup!')};
 S.gems-=i.cost;const r=Math.random();let mul=1,acc=0;for(const[p,m]of G.crit.slice().sort((a,b)=>a[0]-b[0])){acc+=p;if(r<acc){mul=m;break}}
 const g=i.gold*mul;S.gold+=g;bunState().gold.n++;save();if(typeof evCount==='function')try{evCount('goldbuy')}catch(e){}return{ok:1,gold:g,mul,cost:i.cost}}
