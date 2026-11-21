/* =====================================================================
   PAKET (tampilan) — tab "Paket" di Toko, pita penawaran di beranda, pop-up penawaran terbatas,
   Dana Pertumbuhan, dan kartu "Beli Emas" di Toko Emas. Mesin: systems/bundle.js
   ===================================================================== */
const bunRp=n=>tuRp(n);
function bunT(ms){const s=Math.max(0,Math.floor(ms/1e3)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`}
// isi paket sebagai deretan chip ikon
function bunChips(rw,big){const C=[],chip=(icon,n,lbl)=>C.push(`<span class="bchip"><img class="ix" src="${ICON[icon]}">${n!=null?`<b>${typeof n==='number'?fmt(n):n}</b>`:''}${lbl?`<small>${lbl}</small>`:''}</span>`);
 if(rw.pickHero)chip('summon',null,T('Pilih Hero ★{n}',{n:rw.pickHero}));
 if(rw.gems)chip('gem',rw.gems,big?T('Permata'):'');if(rw.tixH)chip('tixH',rw.tixH,big?T('Tiket Hero'):'');if(rw.tixW)chip('tixW',rw.tixW,big?T('Tiket Senjata'):'');
 for(const k of['asc3','asc2','asc1'])if(rw.mats&&rw.mats[k])chip(k,rw.mats[k],big?MD2[k].n:'');
 if(rw.gold)chip('gold',rw.gold>=1e6?(rw.gold/1e6).toLocaleString('id-ID')+T('jt'):fmt(rw.gold),big?T('Emas'):'');if(rw.badge)chip('badge',rw.badge,big?T('Lencana'):'');
 for(const k of['ore3','gem3','gem2'])if(rw.mats&&rw.mats[k])chip(k,rw.mats[k],big?MD2[k].n:'');if(rw.stam)chip('stam',rw.stam,big?T('Stamina'):'');
 return`<div class="bchips">${C.join('')}</div>`}
function bunBtn(b,now){if(b.minLv&&S.lv<b.minLv)return`<button class="btn gray bbuy" disabled>${ic('lock',12)} Lv ${b.minLv}</button>`;
 if(bunLeft(b,now)<=0)return`<button class="btn gray bbuy" disabled>${b.lim==='week'?T('Habis minggu ini'):b.lim==='month'?T('Habis bulan ini'):T('Terbeli ✓')}</button>`;
 return`<button class="btn bbuy" data-act="tuBuy" data-arg="${b.id}">${bunRp(b.price)}</button>`}
function bunCard(b,now=Date.now(),cls=''){const off=b.lim==='offer',lim={once:T('Sekali beli'),week:T('Tiap minggu'),month:T('Tiap bulan'),offer:T('Penawaran terbatas')}[b.lim];
 return`<div class="bcard ${b.id}${cls?' '+cls:''}${b.hot?' hot':''}"><span class="bval">${T('NILAI')}<b>${fmt(b.val)}%</b></span>
  <div class="bhead"><b class="ot">${T(b.n)}</b><small>${lim}${off?` · <em class="btime" data-end="${bunState().offers[b.id]||0}">⏳ ${bunT(bunOfferLeft(b,now))}</em>`:''}</small></div>
  ${bunChips(b.rw,true)}${bunBtn(b,now)}</div>`}
function bunFundHTML(now){const b=bunDef('gf'),own=bunFundOwned(),L=bunFundList(),tot=L.reduce((a,x)=>a+x.gems,0),ready=bunFundReady().reduce((a,x)=>a+x.gems,0);
 return`<div class="bcard gf"><span class="bval">${T('NILAI')}<b>${fmt(b.val)}%</b></span><div class="bhead"><b class="ot">${T(b.n)}</b><small>${T('Bayar sekali, permata cair tiap naik level — total {n} Permata',{n:fmt(tot)})}</small></div>
  <div class="gfl">${L.map(x=>`<span class="gfi${x.got?' got':x.ok&&own?' ok':''}"><small>Lv ${x.lv}</small><img class="ix" src="${ICON.gem}"><b>${fmt(x.gems)}</b></span>`).join('')}</div>
  ${own?(ready?`<button class="btn green bbuy" data-act="bunFund">${T('Klaim {n} Permata',{n:fmt(ready)})}</button>`:`<button class="btn gray bbuy" disabled>${T('Aktif · naikkan level untuk klaim')}</button>`):`<button class="btn bbuy" data-act="tuBuy" data-arg="gf">${bunRp(b.price)}</button>`}</div>`}
function bunShopHTML(){const now=Date.now(),B=BUN(),off=bunActiveOffers(now),one=B.filter(b=>b.lim==='once'&&!b.fund),wk=B.filter(b=>b.lim==='week'),mo=B.filter(b=>b.lim==='month');
 return`${off.length?`<div class="bsec hot">🔥 ${T('Penawaran Terbatas')}</div>${off.map(b=>bunCard(b,now,'offer')).join('')}`:''}
 ${one.filter(b=>bunLeft(b,now)>0).map(b=>bunCard(b,now)).join('')}
 ${bunFundHTML(now)}
 <div class="bsec">${T('Paket Mingguan')} <small>${T('reset Senin 00:00 WIB')}</small></div>${wk.map(b=>bunCard(b,now)).join('')}
 <div class="bsec">${T('Paket Bulanan')}</div>${mo.map(b=>bunCard(b,now)).join('')}
 ${one.filter(b=>bunLeft(b,now)<=0).length?`<div class="bsec">${T('Sudah dibeli')}</div>${one.filter(b=>bunLeft(b,now)<=0).map(b=>bunCard(b,now,'done')).join('')}`:''}
 <p class="sub tunote">${T('Dibayar lewat bot Bank Central Universe di Telegram, isi paket masuk otomatis. Uang & barangnya fiktif.')}</p>`}
// kartu Beli Emas di Toko Emas
function goldBuyHTML(){const g=goldInfo();
 return`<div class="gbuy"><img class="ix gbi" src="${ICON.gold}"><span><b>${T('Beli Emas')}</b><small>${T('{n} Emas · kadang KRITIS ×2/×3 · sisa {a}/{b} hari ini',{n:fmt(g.gold),a:g.left,b:TOPUP_CFG.gold.daily})}</small></span>
  <button class="btn ${g.left&&S.gems>=g.cost?'':'gray'}" data-act="goldBuy" ${g.left?'':'disabled'}>${g.left?`${ic('gem',12)} ${fmt(g.cost)}`:T('Habis')}</button></div>`}
// pita di beranda: penawaran terbatas (hitung mundur) > Dana Pertumbuhan siap klaim > Paket Pemula
function bunPillHTML(){if(!S||!S.welcomed||typeof featOK!=='function'||!featOK('shop'))return'';const now=Date.now(),off=bunActiveOffers(now)[0];
 if(off)return`<button class="bunpill hot" data-act="bunOpen"><img class="ix" src="${ICON.gift}"><b>${T(off.n)}</b><span class="btime" data-end="${bunState().offers[off.id]}">${bunT(bunOfferLeft(off,now))}</span></button>`;
 const r=bunFundReady();if(r.length)return`<button class="bunpill" data-act="bunOpen"><img class="ix" src="${ICON.gem}"><b>${T('Dana Pertumbuhan')}</b><span>${T('klaim {n}',{n:fmt(r.reduce((a,x)=>a+x.gems,0))})}</span></button>`;
 const b1=bunDef('b1');if(b1&&bunAvail(b1,now))return`<button class="bunpill" data-act="bunOpen"><img class="ix" src="${ICON.gift}"><b>${T(b1.n)}</b><span>${bunRp(b1.price)}</span></button>`;return''}
// pop-up penawaran (sekali per penawaran; Paket Pemula maks sekali sehari, 3 hari)
const BUNP={at:0};
function bunPopup(b){BUNP.at=Date.now();sfx('rare');modal(`<div class="bpop"><div class="rays"></div><h3>${b.lim==='offer'?T('PENAWARAN TERBATAS!'):T('KHUSUS PEMAIN BARU!')}</h3>${bunCard(b,Date.now(),'pop')}
 <div class="mrow"><button class="btn gray" data-act="closeModal">${T('Nanti')}</button><button class="btn green" data-act="bunOpen">${T('Lihat Semua Paket')}</button></div></div>`);$('#modal .mbox').classList.add('bpopbox')}
function bunTick(){if(!S||!S.welcomed||typeof B!=='undefined'&&B||tab!=='home')return;const now=Date.now(),pill=$('#bunPill');
 if(pill){const h=bunPillHTML();if(pill.dataset.h!==h.replace(/<span class="btime"[^<]*<\/span>/,'')){pill.innerHTML=h;pill.dataset.h=h.replace(/<span class="btime"[^<]*<\/span>/,'')}}
 document.querySelectorAll('.btime[data-end]').forEach(e=>{const t=+e.dataset.end-now;e.textContent=(e.closest('.bcard')?'⏳ ':'')+bunT(t)});
 if($('#modal').classList.contains('on')||typeof featOK!=='function'||!featOK('shop'))return;
 const off=bunOffers(now);if(off){bunPopup(off);return}
 const Bs=bunState(),d=wibDay(now),b1=bunDef('b1');Bs.pop=Bs.pop||{};
 if(b1&&bunAvail(b1,now)&&Bs.pop.b1!==d&&(Bs.pop.n||0)<3&&S.lv>=4&&now-BUNP.at>10*6e4){Bs.pop.b1=d;Bs.pop.n=(Bs.pop.n||0)+1;save();bunPopup(b1)}}
setInterval(bunTick,1000);
Object.assign(ACT,{
 bunOpen:()=>{shopTab='bun';openShop()},
 bunFund:()=>{const g=bunFundClaim();if(!g)return;sfx('claim');updateTop();toast(T('+{n} Permata dari Dana Pertumbuhan!',{n:fmt(g)}));shopTab='bun';openShop()},
 goldBuy:()=>{const r=goldBuy();if(r.err){toast(r.err,1);sfx('deny');return}sfx(r.mul>1?'rare':'claim');updateTop();toast(r.mul>1?T('KRITIS ×{m}! +{n} Emas',{m:r.mul,n:fmt(r.gold)}):T('+{n} Emas',{n:fmt(r.gold)}));openShop()},
});
