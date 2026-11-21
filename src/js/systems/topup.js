/* =====================================================================
   TOP UP (mesin) — pesanan, kode voucher (HMAC-SHA256), bonus pertama, Kartu Bulanan
   S.iap = {orders:{id:{sku,price,t,st:'wait'|'paid'|'exp',paidT}}, first:{sku:1}, card:{until,last}, spent, bot}
   ===================================================================== */
// ---- SHA-256 & HMAC murni JS (crypto.subtle tidak tersedia di semua konteks, mis. http://) ----
const SHA256=(()=>{const K=[];for(let i=0,n=2;i<64;n++){let p=1;for(let d=2;d*d<=n;d++)if(n%d===0){p=0;break}if(p)K[i++]=(Math.cbrt(n)%1)*4294967296|0}
 const r=(x,n)=>x>>>n|x<<32-n;
 return bytes=>{const H=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],l=bytes.length,m=new Uint8Array(((l+9+63)>>6)<<6);m.set(bytes);m[l]=128;const bl=l*8;for(let i=0;i<4;i++)m[m.length-1-i]=bl/2**(8*i)&255;
  const w=new Int32Array(64);for(let o=0;o<m.length;o+=64){for(let i=0;i<16;i++)w[i]=m[o+i*4]<<24|m[o+i*4+1]<<16|m[o+i*4+2]<<8|m[o+i*4+3];
   for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(r(a,7)^r(a,18)^a>>>3)+w[i-16]+(r(b,17)^r(b,19)^b>>>10)+w[i-7]|0}
   let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const t1=h+(r(e,6)^r(e,11)^r(e,25))+(e&f^~e&g)+K[i]+w[i]|0,t2=(r(a,2)^r(a,13)^r(a,22))+(a&b^a&c^b&c)|0;h=g;g=f;f=e;e=d+t1|0;d=c;c=b;b=a;a=t1+t2|0}
   H[0]=H[0]+a|0;H[1]=H[1]+b|0;H[2]=H[2]+c|0;H[3]=H[3]+d|0;H[4]=H[4]+e|0;H[5]=H[5]+f|0;H[6]=H[6]+g|0;H[7]=H[7]+h|0}
  const out=new Uint8Array(32);H.forEach((v,i)=>{out[i*4]=v>>>24;out[i*4+1]=v>>>16&255;out[i*4+2]=v>>>8&255;out[i*4+3]=v&255});return out}})();
const utf8=s=>new TextEncoder().encode(s);
function hmac256(key,msg){let k=utf8(key);if(k.length>64)k=SHA256(k);const kp=new Uint8Array(64);kp.set(k);
 const ip=kp.map(b=>b^0x36),op=kp.map(b=>b^0x5c),m=utf8(msg),a=new Uint8Array(64+m.length);a.set(ip);a.set(m,64);
 const ih=SHA256(a),b=new Uint8Array(96);b.set(op);b.set(ih,64);return SHA256(b)}
const B32='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // tanpa I, O, 0, 1 supaya tidak tertukar
function b32(bytes,n){let bits=0,v=0,s='';for(const x of bytes){v=v<<8|x;bits+=8;while(bits>=5&&s.length<n){s+=B32[v>>>bits-5&31];bits-=5}if(s.length>=n)break}return s}
// kode voucher untuk pesanan: XXXXX-XXXXX (sama persis dengan code_for() di bot)
function tuCode(id,sku,price){const c=b32(hmac256(TOPUP_CFG.secret,`${id}|${sku}|${price}`),10);return c.slice(0,5)+'-'+c.slice(5)}
const tuNorm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

/* ---------------- state & katalog ---------------- */
function tuState(){if(!S.iap||typeof S.iap!=='object')S.iap={orders:{},first:{},card:{until:-1,last:-1},spent:0,bot:''};const I=S.iap;
 if(!I.orders)I.orders={};if(!I.first)I.first={};if(!I.card)I.card={until:-1,last:-1};
 const now=Date.now();for(const[id,o]of Object.entries(I.orders)){if(o.st==='wait'&&now-o.t>TOPUP_CFG.ttl)o.st='exp'}
 const ids=Object.keys(I.orders).sort((a,b)=>I.orders[b].t-I.orders[a].t);for(const id of ids.slice(30))delete I.orders[id];  // simpan 30 terakhir
 return I}
const tuSku=sku=>{if(sku===TOPUP_CFG.card.id)return Object.assign({card:1},TOPUP_CFG.card);const p=TOPUP_CFG.packs.find(p=>p.id===sku);if(p)return p;const b=(TOPUP_CFG.bundles||[]).find(b=>b.id===sku);return b?Object.assign({bun:1},b):undefined};
const tuRp=n=>'Rp'+Math.round(n).toLocaleString('id-ID');
function tuName(sku){const p=tuSku(sku);if(!p)return sku;return p.bun?T(p.n):p.card?T('Kartu Bulanan'):T('{n} Permata',{n:fmt(p.gems)})}
// permata yang didapat dari paket (memperhitungkan bonus pertama)
function tuGemsFor(sku){const p=tuSku(sku),I=tuState();if(p.bun)return p.rw&&p.rw.gems||0;if(p.card)return p.now;return p.gems+(I.first[sku]?p.bonus:p.gems)}
const tuCardLeft=()=>{const I=tuState(),d=wibDay();return I.card.until>=d?I.card.until-d+1:0};

/* ---------------- pesanan ---------------- */
function tuNewId(){const r=new Uint8Array(6);(crypto.getRandomValues?crypto.getRandomValues(r):r.forEach((_,i)=>r[i]=Math.random()*256|0));return TOPUP_CFG.prefix+b32(r,8)}
function tuOrder(sku){const p=tuSku(sku);if(!p)return null;const I=tuState();
 if(p.card&&tuCardLeft()+p.days>p.maxDays)return{err:T('Kartu Bulanan sudah maksimal ({n} hari).',{n:p.maxDays})}
 if(p.bun&&!bunAvail(bunDef(sku)))return{err:p.minLv&&S.lv<p.minLv?T('Paket ini terbuka di Lv {n}.',{n:p.minLv}):T('Paket ini sudah dibeli atau sudah tidak tersedia.')}
 // pakai lagi pesanan yang masih menunggu untuk paket yang sama
 const old=Object.entries(I.orders).find(([,o])=>o.sku===sku&&o.st==='wait');if(old)return{id:old[0]};
 const id=tuNewId();I.orders[id]={sku,price:p.price,t:Date.now(),st:'wait'};save();return{id}}
// payload deep link Telegram (maks 64 karakter, hanya A-Z a-z 0-9 _ -)
const tuPayload=id=>{const o=S.iap.orders[id];return`aster-${id}-${o.sku}-${o.price}`};
const tuCommand=id=>{const o=S.iap.orders[id];return`/topup ${id} ${o.sku} ${o.price}`};
function tuLink(id){const b=(S.iap.bot||'').replace(/^@/,'').trim();return b?`https://t.me/${b}?start=${tuPayload(id)}`:''}
// tukar kode: cocokkan dengan pesanan yang menunggu (atau pesanan tertentu)
function tuRedeem(code,onlyId){const I=tuState(),c=tuNorm(code);if(c.length!==10)return{err:T('Kode voucher harus 10 karakter (XXXXX-XXXXX).')};
 for(const[id,o]of Object.entries(I.orders)){if(onlyId&&id!==onlyId)continue;if(tuNorm(tuCode(id,o.sku,o.price))!==c)continue;
  if(o.st==='paid')return{err:T('Kode ini sudah dipakai.')};
  return tuDeliver(id)}
 return{err:T('Kode tidak cocok dengan pesanan mana pun. Pastikan kode dari pesanan yang benar dan belum kedaluwarsa.')}}
function tuDeliver(id){const I=tuState(),o=I.orders[id],p=tuSku(o.sku);let rw={},first=false;
 if(p.bun){rw=bunDeliver(o.sku).rw||{};o.st='paid';o.paidT=Date.now();o.gems=rw.gems||0;I.spent=(I.spent||0)+o.price;save();return{ok:1,id,sku:o.sku,rw,bun:1}}
 if(p.card){rw.gems=p.now;const d=wibDay();I.card.until=Math.max(I.card.until,d-1)+p.days;
  // permata hari ini langsung masuk juga (lewat surat)
 }else{first=!I.first[o.sku];rw.gems=p.gems+(first?p.gems:p.bonus);I.first[o.sku]=1}
 grant(rw);o.st='paid';o.paidT=Date.now();o.gems=rw.gems;I.spent=(I.spent||0)+o.price;save();if(p.card)tuCardTick();
 return{ok:1,id,sku:o.sku,rw,first,card:!!p.card}}
// Kartu Bulanan: kirim permata harian lewat surat (sekali per hari WIB, hari yang terlewat hangus)
function tuCardTick(){const I=tuState(),d=wibDay(),c=TOPUP_CFG.card;if(I.card.until<d||I.card.last===d)return;I.card.last=d;
 sendMail({id:'mc_'+d,from:TOPUP_CFG.merchant,title:T('Kartu Bulanan · sisa {n} hari',{n:I.card.until-d}),body:T('Permata harian Kartu Bulanan untuk hari ini. Jangan lupa login setiap hari!'),rw:{gems:c.daily}})}

/* ---------------- pengiriman otomatis (server bank di Cloudflare) ---------------- */
// Selama ada pesanan menunggu, game menanyakan status pesanan ke server bank tiap beberapa detik
// (dan langsung saat aplikasi dibuka lagi dari Telegram). Kode dari server tetap diverifikasi seperti input manual.
const TU={timer:0,busy:0};
const tuWaiting=()=>Object.entries(tuState().orders).filter(([,o])=>o.st==='wait');
async function tuPoll(){const api=TOPUP_CFG.api;if(TU.busy||!api)return;const w=tuWaiting();if(!w.length){tuStopListen();return}TU.busy=1;
 try{for(const[id]of w.slice(0,3)){const r=await(await fetch(`${api}/api/order/${id}`,{cache:'no-store'})).json();
   if(r&&r.st==='paid'&&S.iap.orders[id]&&S.iap.orders[id].st==='wait'){const res=tuRedeem(r.c,id);if(res.ok)tuAuto(res)}}}catch(e){}finally{TU.busy=0}}
function tuListen(){if(TU.timer||!TOPUP_CFG.api||!tuWaiting().length)return;TU.timer=setInterval(()=>{if(document.visibilityState==='visible')tuPoll()},TOPUP_CFG.pollMs);tuPoll()}
function tuStopListen(){clearInterval(TU.timer);TU.timer=0}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&typeof S!=='undefined'&&S&&S.iap){tuListen();tuPoll()}});
