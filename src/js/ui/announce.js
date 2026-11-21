/* =====================================================================
   PENGUMUMAN SERVER — tampilan (mesin: systems/announce.js · gaya: css/announce.css)
   - Pita berjalan: strip Obrolan Dunia di beranda berubah emas & menggeser teks pengumuman, satu per satu.
   - Obrolan Dunia: baris [Sistem] di antara pesan (nama bisa diketuk → profil).
   - Peringkat › Rekor: daftar rekor pertama server (siapa & kapan).
   ===================================================================== */
ICON.horn=pxIcon(K=>{K.rect(1,6,3,4,'#a8650e');K.poly([[3.5,5],[11.5,1],[11.5,15],[3.5,11]],'#ffc83d');K.poly([[3.5,5],[11.5,1],[11.5,5],[3.5,7.5]],'#ffe9a0');
 K.rect(11,1,2,14,'#e0a020');K.rect(12,2,1,12,'#c98a1a');K.rect(5,11,2,4,'#a8650e');K.pts([[14,5],[15,6],[15,7],[15,8],[15,9],[14,10]],'#fff6c0');K.P(4,7,'#fff6c0')});
const annNm=(a,link)=>link&&a.uid?`<button class="ann-n" data-act="profView" data-arg="${esc(a.uid)}">${esc(a.u)}</button>`:`<b class="ann-n">${esc(a.u)}</b>`;
const annH=id=>`<b class="ann-h${HD[id]&&HD[id].limited?' lim':''}">${HD[id]?HD[id].name:esc(id)}</b>`;
// teks satu pengumuman (HTML). link: nama bisa diketuk (Obrolan Dunia)
function annHTML(a,link){const d=a.d||{},n=annNm(a,link);
 if(a.ty==='p3'){const hs=(d.h||[]).filter(id=>HD[id]);if(!hs.length)return'';if(d.n)return T('Hoki! {n} mendapatkan ★3 {h} hanya dalam {k} tarikan!',{n,h:annH(hs[0]),k:d.n});
  return T(d.l?'Selamat! {n} mendapatkan ★3 terbatas {h}!':'Selamat! {n} mendapatkan ★3 {h}!',{n,h:hs.map(annH).join(' & ')})}
 if(a.ty==='vip')return d.v>=7?T('{n} mencapai VIP {v}, tingkat tertinggi!',{n,v:d.v}):T('Selamat! {n} naik ke VIP {v}!',{n,v:d.v});
 if(a.ty==='t10')return T('Selamat! {n} masuk 10 besar Peringkat CP server!',{n});
 if(a.ty==='top1'){const p=d.pn?`<b class="ann-n">${esc(d.pn)}</b>`:'';
  return d.b==='ar'?(p?T('{n} menggeser {p} dari puncak Arena!',{n,p}):T('{n} kini memimpin peringkat Arena!',{n})):(p?T('{n} merebut Peringkat #1 CP server dari {p}!',{n,p}):T('{n} kini Peringkat #1 CP server!',{n}))}
 if(a.ty==='rec'){const[k,v]=String(d.r||'').split(':'),x=+v;
  return k==='st'?T('Rekor server! {n} jadi yang pertama menamatkan {w}!',{n,w:`<b class="ann-h">${WORLDS[x-1]?WORLDS[x-1].n:x}</b>`})
   :k==='cp'?T('Rekor server! {n} jadi yang pertama menembus CP {v}!',{n,v:`<b class="ann-h">${fmt(x)}</b>`})
   :k==='a'?T('Rekor server! {n} jadi yang pertama membangkitkan hero ke ★{s}!',{n,s:x}):T('Rekor server! {n} jadi yang pertama mengoleksi semua {c} hero!',{n,c:x})}
 if(a.ty==='mvp')return d.k?T('Bos Dunia {b} tumbang! MVP: {n} dengan {d} damage.',{b:T(d.b||''),n,d:`<b class="ann-h">${fmt(d.dmg||0)}</b>`}):T('Bos Dunia {b} berhasil kabur. Damage terbesar: {n}.',{b:T(d.b||''),n});
 return''}
const annTag=a=>a.ty==='rec'?T('REKOR'):a.ty==='top1'?'#1':a.ty==='t10'?'TOP 10':a.ty==='mvp'?'MVP':a.ty==='vip'?'VIP':'★3';

/* ---------- pita berjalan (strip Obrolan Dunia di beranda) ---------- */
function annStripHTML(a){return`<span class="anico"><img class="ix" src="${ICON.horn}" alt=""></span><i class="antag">${annTag(a)}</i><span class="anmq"><span class="anmt">${annHTML(a,false)}</span></span>`}
// teks pendek: masuk dari kanan; teks panjang: diam sebentar lalu menggeser sampai ujungnya terbaca. Hasil = lama tampil (ms)
function annMarquee(el){const C=ANN_CFG,box=el.querySelector('.anmq'),tx=el.querySelector('.anmt');if(!box||!tx||!tx.animate)return C.show;
 const W=box.clientWidth,w=tx.scrollWidth;
 if(w<=W-2){tx.animate([{transform:`translateX(${Math.round(W*.45)}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:520,easing:'cubic-bezier(.2,.8,.3,1)'});return C.show}
 const dx=w-W+14,mv=dx/40*1000,hold=1400,tot=hold+mv+1800;
 tx.animate([{transform:'translateX(0)',offset:0},{transform:'translateX(0)',offset:hold/tot},{transform:`translateX(${-dx}px)`,offset:(hold+mv)/tot},{transform:`translateX(${-dx}px)`,offset:1}],{duration:tot,fill:'forwards'});
 return Math.max(C.show,tot+300)}
// dipanggil tiap 1,5 dtk dari chatTick (ui/chat.js): true = strip sedang memutar pengumuman
function annStripTick(el){if(!el)return false;const now=Date.now();
 if(ANN.cur&&ANN.curT&&now>=ANN.curT)ANN.cur=null;
 if(!ANN.cur){while(ANN.q.length&&now-ANN.q[0].ts>ANN_CFG.fresh)ANN.q.shift();ANN.cur=ANN.q.shift()||null;ANN.curT=0}
 if(!ANN.cur){if(el.classList.contains('ann')){el.classList.remove('ann');delete el.dataset.an;el.innerHTML=chatStripHTML()}return false}
 if(el.dataset.an!==String(ANN.cur.id)){el.dataset.an=String(ANN.cur.id);el.classList.add('ann');el.innerHTML=annStripHTML(ANN.cur);const d=annMarquee(el);if(!ANN.curT)ANN.curT=now+d}
 return true}

/* ---------- Obrolan Dunia: baris [Sistem] ---------- */
function annChat(L){const now=Date.now(),from=L.length?L[0].ts:now-3*36e5;return ANN.list.filter(a=>a.ts<=now&&a.ts>=from&&!(a.d&&a.d.q)&&annHTML(a,false)).map(a=>({sys:1,ts:a.ts,a}))}
function annRowHTML(a){return`<div class="chsys${annHot(a)?' hot':''}"><img class="ix" src="${ICON.horn}" alt=""><p>${annHTML(a,true)}<small>${chTime(a.ts)}</small></p></div>`}

/* ---------- Peringkat › Rekor ---------- */
function annRecTitle(r){const[k,v]=r.split(':'),n=+v;
 return k==='st'?T('Pertama menamatkan {w}',{w:WORLDS[n-1]?WORLDS[n-1].n:n}):k==='cp'?T('Pertama menembus CP {v}',{v:fmt(n)}):k==='a'?T('Pertama punya hero ★{s}',{s:n}):T('Pertama koleksi lengkap ({c} hero)',{c:n})}
const annRecIc=r=>{const k=r.split(':')[0];return k==='st'?ICON.adv:k==='cp'?ICON.rank:k==='a'?(ICON.asc3||ICON.summon):ICON.summon};
const ANN_RECG=[['st','Petualangan'],['cp','Kekuatan Tim'],['a','Kebangkitan'],['all','Koleksi']];
function annRecPanelHTML(){if(!ANN.st)return`<p class="sub" style="text-align:center;padding:30px 0">${T('Memuat rekor...')}</p>`;
 const R={};for(const x of ANN.st.rec||[])R[x.r]=x;const L=annRecList(),got=L.filter(r=>R[r]).length,now=Date.now();
 const row=r=>{const x=R[r],mine=x&&loggedIn()&&String(x.uid)===String(NET.acct.uid);
  return`<div class="rcrow${x?'':' none'}${mine?' mine':''}"><span class="rcic"><img class="ix" src="${annRecIc(r)}" alt=""></span><span class="rct"><b>${annRecTitle(r)}</b><small>${x?agoMs(now-x.ts):T('Belum ada — jadilah yang pertama!')}</small></span>${x?`<button class="rcwho" data-act="profView" data-arg="${esc(x.uid)}">${esc(x.u)}${mine?` <em>${T('Kamu')}</em>`:''}</button>`:''}</div>`};
 return`<div class="rkinfo"><span>${typeof NET!=='undefined'&&NET.srvName?`<em class="rksrv">S${netSrv()} · ${esc(NET.srvName)}</em> `:''}<b>${got}</b>/${L.length} ${T('rekor tercatat')}</span></div>
 <p class="rcnote">${T('Siapa yang pertama di server ini? Rekor tercatat selamanya sampai server dibuka ulang.')}</p>
 <div class="rklist rclist" id="rkScroll">${ANN_RECG.map(([k,n])=>{const G=L.filter(r=>r.split(':')[0]===k);return`<div class="rcsec">${T(n)} <i>${G.filter(r=>R[r]).length}/${G.length}</i></div>${G.map(row).join('')}`}).join('')}</div>`}
