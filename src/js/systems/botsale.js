/* =====================================================================
   PENJUALAN BOT -> BANK TELEGRAM
   Pembelian top up para bot (systems/bots.js: botSpend) dilaporkan ke bot bank (bank-worker/)
   sebagai pemasukan rekening HUN2 STUDIO. Lihat di Telegram: /toko.
   - Kunci tiap penjualan unik (dunia bot + bot + waktu + paket) -> server membuang duplikat,
     jadi aman walau banyak pemain/perangkat melapor bersamaan.
   - Hanya penjualan sejak BOT_CFG.SPEND.bankFrom dan maksimal 3 hari ke belakang.
   - Ditandatangani HMAC (TOPUP_CFG.secret) supaya tidak bisa dikirim sembarangan.
   ===================================================================== */
const BSALE={at:0,busy:false,KEY:'aster_botsale_at'};
const bsHex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
function botSales(from,to){const L=[];
 for(const i of botsIds(to)){const b=botBase(i);if(b.tier.id==='f2p'||b.spend0>to||b.endT<from)continue;const sp=botSpend(b,to);
  for(let k=sp.buys.length-1;k>=0;k--){const o=sp.buys[k];if(o.t<=from)break;if(o.t>to)continue;
   const w=bW(i);L.push({k:`${w.e}-${w.g}-${bLi(i)}-${Math.floor(o.t)}-${o.id}`,n:botName(i,o.t),sku:o.id,p:o.price,t:Math.floor(o.t)})}}
 return L.sort((a,b)=>a.t-b.t)}
async function botSaleReport(){const api=TOPUP_CFG.api;if(typeof NET!=='undefined'&&NET.downUntil>Date.now())return;
 // hanya dunia bot ASLI dari server (bukan dunia cadangan lokal / halaman uji / simulator) yang boleh melapor ke bank
 if(typeof NET==='undefined'||!NET.worldOk||!NET.wsig||NET.wsig!==(BOTS.W||[]).map(w=>w.g).join(','))return;if(!api||BSALE.busy||!botsWarmOk()||!BOTS.names.length||BOTS.names.length<botsVisible())return;
 const now=Date.now();let at=BSALE.at;if(!at){try{at=+localStorage.getItem(BSALE.KEY)||0}catch(e){}}
 const from=Math.max(at,BOT_CFG.SPEND.bankFrom,now-3*BDAY+6e4),L=botSales(from,now-3e4);if(!L.length){BSALE.at=Math.max(from,now-3e4);return}
 BSALE.busy=true;try{for(let k=0;k<L.length;k+=40){const part=L.slice(k,k+40),sig=bsHex(hmac256(TOPUP_CFG.secret,part.map(s=>[s.k,s.n,s.sku,s.p,s.t].join('|')).join('\n')));
   const r=await fetch(api.replace(/\/$/,'')+'/api/botsale',{method:'POST',headers:{'content-type':'text/plain'},body:JSON.stringify({sales:part,sig})});if(!r.ok)throw new Error('http '+r.status);
   BSALE.at=part[part.length-1].t;try{localStorage.setItem(BSALE.KEY,String(BSALE.at))}catch(e){}}}
 catch(e){}finally{BSALE.busy=false}}
setTimeout(()=>{botSaleReport();setInterval(botSaleReport,6e4)},2e4);
