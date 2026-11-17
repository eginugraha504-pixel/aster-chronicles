/* =====================================================================
   TOP UP (tampilan) — tab "Top Up" di Toko, tagihan pesanan, tukar kode voucher, riwayat
   ===================================================================== */
const tuGemPile=(k,s=40)=>`<span class="tupile n${k}">${Array.from({length:Math.min(6,k)},(_,i)=>`<img class="ix" src="${ICON.gem}" style="--i:${i};width:${s}px;height:${s}px">`).join('')}</span>`;
function tuShopHTML(){const I=tuState(),C=TOPUP_CFG.card,left=tuCardLeft(),bot=I.bot;
 const packs=TOPUP_CFG.packs.map((p,k)=>{const first=!I.first[p.id];return`<button class="tupack${k>=4?' big':''}" data-act="tuBuy" data-arg="${p.id}">
  ${first?`<span class="tufirst">${T('Pertama ×2')}</span>`:p.bonus?`<span class="tubon">+${fmt(p.bonus)}</span>`:''}
  ${tuGemPile(k+1,k>=4?34:30)}<b class="ot">${fmt(p.gems)}</b><small>${first?`+${fmt(p.gems)} ${T('bonus')}`:p.bonus?`+${fmt(p.bonus)} ${T('bonus')}`:T('Permata')}</small><span class="tuprice">${tuRp(p.price)}</span></button>`}).join('');
 const wait=Object.entries(I.orders).filter(([,o])=>o.st==='wait');
 return`<div class="tubank${bot?'':' need'}"><span class="tbic">🏦</span><div><b>Bank Central Universe</b><small>${bot?T('Bayar lewat bot Telegram @{b}',{b:esc(bot.replace(/^@/,''))}):T('Atur username bot bank-mu dulu supaya tombol bayar langsung membuka Telegram.')}</small></div><button class="btn ${bot?'blue':''} sm" data-act="tuBot">${bot?T('Ubah'):T('Atur')}</button></div>
 ${wait.length?`<button class="tuwait" data-act="tuOpen" data-arg="${wait[0][0]}">⏳ ${T('{n} pesanan menunggu pembayaran',{n:wait.length})} · <b>${tuName(wait[0][1].sku)}</b> ›</button>`:''}
 <button class="tucard" data-act="tuBuy" data-arg="${C.id}"><span class="tcl">${T('KARTU BULANAN')}</span>
  <span class="tcm">${tuGemPile(3,30)}<span><span class="tc1">${T('{a} langsung + {b}/hari × {c}',{a:`<b>${fmt(C.now)}</b>`,b:`<b>${fmt(C.daily)}</b>`,c:C.days})}</span><small>${T('Total {n} Permata', {n:fmt(C.now+C.daily*C.days)})}${left?` · <em>${T('Aktif, sisa {n} hari',{n:left})}</em>`:''}</small></span>
  <span class="tuprice">${tuRp(C.price)}</span></button>
 <div class="tugrid">${packs}</div>
 <div class="tuvc"><input id="tuCode" placeholder="${T('Punya kode voucher? XXXXX-XXXXX')}" maxlength="13" autocapitalize="characters" autocomplete="off"><button class="btn green" data-act="tuRedeem">${T('Tukar')}</button></div>
 <div class="mrow"><button class="btn blue sm" data-act="tuHist">📜 ${T('Riwayat Top Up')}</button></div>
 <p class="sub tunote">${T('Permata & uangnya fiktif: dibayar dengan saldo rekening Bank Central Universe di Telegram, lalu kode voucher dari bot ditukar di sini.')}</p>`}

/* ---- tagihan pesanan ---- */
function tuOpen(id){const I=tuState(),o=I.orders[id];if(!o)return;const p=tuSku(o.sku),link=tuLink(id),cmd=tuCommand(id),get=o.st==='paid'?o.gems:tuGemsFor(o.sku);
 const st={wait:['wait',T('Menunggu pembayaran')],paid:['paid',T('Lunas')],exp:['exp',T('Kedaluwarsa')]}[o.st];
 modal(`<button class="btn red mclose" data-act="tuBack">‹</button><h3>🧾 ${T('Tagihan')}</h3>
 <div class="tubill"><div class="tbh">${tuGemPile(p.card?3:Math.min(6,TOPUP_CFG.packs.indexOf(p)+1),30)}<span><b class="ot">${tuName(o.sku)}</b><small>${p.card?T('{a} langsung + {b}/hari × {c} hari',{a:fmt(p.now),b:fmt(p.daily),c:p.days}):T('Kamu dapat {n} Permata',{n:fmt(get)})}</small></span></div>
  <div class="tbr"><span>${T('Total')}</span><b>${tuRp(o.price)}</b></div>
  <div class="tbr"><span>${T('ID Pesanan')}</span><b><code>${id}</code></b></div>
  <div class="tbr"><span>${T('Penerima')}</span><b>${TOPUP_CFG.merchant}</b></div>
  <div class="tbr"><span>${T('Status')}</span><b class="tust ${st[0]}">${st[1]}</b></div></div>
 ${o.st==='wait'?`<div class="tustep"><b>1</b><span>${T('Bayar di bot Bank Central Universe')}</span></div>
  ${link?`<a class="btn tutg" href="${link}" target="_blank" rel="noopener">✈️ ${T('Bayar di Telegram')}</a>`:`<button class="btn tutg" data-act="tuBot">✈️ ${T('Atur username bot bank dulu')}</button>`}
  <div class="tucmd"><small>${T('Atau kirim perintah ini ke bot:')}</small><code>${cmd}</code><button class="btn blue sm" data-act="tuCopy" data-arg="${id}">${T('Salin')}</button></div>
  <div class="tustep"><b>2</b><span>${T('Kembali ke game')}</span></div>
  <div class="tulive"><i class="spin"></i><span>${T('Menunggu pembayaran... Permata masuk otomatis setelah kamu menekan ✅ Bayar di bot.')}</span></div>
  <details class="tuman"><summary>${T('Belum masuk? Tempel kode voucher')}</summary><div class="tuvc"><input id="tuCode" placeholder="XXXXX-XXXXX" maxlength="13" autocapitalize="characters" autocomplete="off"><button class="btn green" data-act="tuRedeem" data-arg="${id}">${T('Konfirmasi')}</button></div></details>
  <small class="tuttl">${T('Berlaku sampai {t}',{t:new Date(o.t+TOPUP_CFG.ttl).toLocaleString(S.lang==='en'?'en-GB':S.lang==='ja'?'ja-JP':'id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})})}</small>`
 :o.st==='paid'?`<p class="sub">${T('Dibayar {t}. {n} Permata sudah masuk.',{t:agoTxt(o.paidT),n:fmt(o.gems||0)})}</p>`:`<div class="mrow"><button class="btn" data-act="tuBuy" data-arg="${o.sku}">${T('Buat Pesanan Baru')}</button></div>`}`)}
function tuHist(){const I=tuState(),L=Object.entries(I.orders).sort((a,b)=>b[1].t-a[1].t);
 modal(`<button class="btn red mclose" data-act="tuBack">‹</button><h3>📜 ${T('Riwayat Top Up')}</h3>
 <div class="tusum"><span>${T('Total belanja')}</span><b>${tuRp(I.spent||0)}</b></div>
 ${L.length?`<div class="tuhist">${L.map(([id,o])=>`<button class="tuh ${o.st}" data-act="tuOpen" data-arg="${id}"><span><b>${tuName(o.sku)}</b><small>${id} · ${agoTxt(o.t)}</small></span><span><b>${tuRp(o.price)}</b><small class="tust ${o.st}">${{wait:T('Menunggu'),paid:T('Lunas'),exp:T('Kedaluwarsa')}[o.st]}</small></span></button>`).join('')}</div>`:`<p class="sub">${T('Belum ada transaksi.')}</p>`}`)}
function tuSuccess(r){sfx('rare');const p=tuSku(r.sku);
 modal(`<div class="tuok"><div class="rays"></div><h3>${T('Pembayaran Berhasil!')}</h3>${tuGemPile(p.card?3:Math.min(6,TOPUP_CFG.packs.indexOf(p)+1),44)}
 <b class="ot tugot">+${fmt(r.rw.gems)}</b><small>${T('Permata')}</small>
 ${r.first?`<span class="tufirst big">${T('Bonus pembelian pertama ×2!')}</span>`:''}
 ${r.card?`<p class="sub">${T('Kartu Bulanan aktif, sisa {n} hari. Permata harian dikirim ke Kotak Surat setiap hari.',{n:tuCardLeft()})}</p>`:''}
 <div class="mrow"><button class="btn" data-act="tuBack">${T('Mantap!')}</button></div></div>`);$('#modal .mbox').classList.add('tuokbox');render()}
// pembayaran masuk otomatis (bisa terjadi di layar mana pun)
function tuAuto(r){if(B){toast(T('Top up berhasil! +{n} Permata',{n:fmt(r.rw.gems)}));sfx('rare');return}tuSuccess(r)}
function tuCopyText(t){const done=()=>toast(T('Disalin!'));try{navigator.clipboard.writeText(t).then(done,()=>fb())}catch(e){fb()}
 function fb(){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');done()}catch(e){toast(t)}a.remove()}}

Object.assign(ACT,{
 tuBuy:sku=>{const r=tuOrder(sku);if(!r)return;if(r.err){toast(r.err,1);return}sfx('tap');tuOpen(r.id);tuListen()},
 tuOpen:id=>tuOpen(id),
 tuBack:()=>{shopTab='tu';openShop()},
 tuHist:()=>tuHist(),
 tuCopy:id=>tuCopyText(tuCommand(id)),
 tuRedeem:id=>{const v=($('#tuCode')||{}).value;const r=tuRedeem(v,id||null);if(r.err){toast(r.err,1);sfx('deny');return}tuSuccess(r)},
 tuBot:()=>{const cur=S.iap.bot||'';const v=prompt(T('Username bot Bank Central Universe (contoh: BankCentralUniverseBot):'),cur);if(v==null)return;
  const b=v.trim().replace(/^@/,'').replace(/^https?:\/\/t\.me\//,'');if(b&&!/^[A-Za-z0-9_]{5,32}$/.test(b)){toast(T('Username tidak valid.'),1);return}S.iap.bot=b;save();shopTab='tu';openShop()},
});
