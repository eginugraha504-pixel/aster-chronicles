/* =====================================================================
   PENONTON — akun khusus (dibuat pemilik lewat Telegram /penonton): dashboard papan peringkat
   SEMUA server + papan raid Bos Dunia (yang sedang berlangsung & yang sudah selesai). Hanya melihat:
   tidak memuat data simpanan, tidak bermain, tidak tampil di papan mana pun.
   - Server yang sedang dilihat = NET.acct.srv → netWorld / netPlayers / wbPull memuat server itu,
     dunia bot dihitung persis sama seperti di game pemain server tersebut.
   - Server belum rilis / terjadwal: hanya kartu status (belum ada pemain).
   ===================================================================== */
const WT={sv:'all',tab:'cp',list:[],at:0,n:100,loading:false,mark:false,top:{},raid:null,rb:null,rload:false,timer:0,sig:''};
const watchMode=()=>!!(typeof NET!=='undefined'&&NET.acct&&NET.acct.tok&&NET.acct.watch);
const WT_TABS=[['cp','CP Tim'],['lv','Level'],['ar','Arena'],['gd','Guild'],['wb','Raid Bos']];

async function watchOpen(){
 const L=document.getElementById('login');try{cancelAnimationFrame(loginRAF)}catch(e){}
 const tr=typeof transEl==='function'?transEl('Membuka dashboard penonton...'):null;if(tr){await sleep(40);tr.classList.add('on');await sleep(900)}
 L.classList.remove('on','enter','again');L.innerHTML='';lgMode='tap';lgOpened=false;try{closeModal()}catch(e){}
 let el=document.getElementById('watch');if(!el){el=document.createElement('div');el.id='watch';document.body.appendChild(el)}el.classList.add('on');
 WT.sv='all';WT.tab='cp';WT.raid=null;WT.rb=null;watchRender();
 if(tr){tr.classList.remove('on');setTimeout(()=>tr.remove(),500)}
 await watchSrvList(true);watchRender();
 clearInterval(WT.timer);WT.timer=setInterval(watchTick,1e4)}
function watchClose(){clearInterval(WT.timer);WT.timer=0;const el=document.getElementById('watch');if(el){el.classList.remove('on');el.innerHTML=''}}
async function watchSrvList(force){if(!force&&Date.now()-WT.at<6e4)return;const o=await api('/api/servers');if(o&&o.ok){WT.list=o.list||[];WT.at=Date.now()}}
const wtSrv=id=>WT.list.find(x=>x.id===+id);
const wtSt=x=>!x?'gone':x.st==='list'?'list':x.opened>Date.now()?'soon':'open';
const wtBadge=x=>{const s=wtSt(x);return`<i class="wvst s-${s}">${s==='list'?T('BELUM RILIS'):s==='soon'?T('SEGERA'):x.full?T('PENUH'):T('BUKA')}</i>`};
const wtDay=x=>Math.floor((Date.now()-x.opened)/864e5)+1;

// pindah server yang dilihat: muat dunia bot + pemain asli server itu, lalu hitung ringkasan semua bot
async function watchPick(id){if(id!=='all')id=+id;if(WT.sv===id&&!WT.loading){watchRender();return}WT.sv=id;WT.n=100;WT.raid=null;WT.rb=null;
 if(id==='all'){WT.loading=false;watchRender();return}
 const x=wtSrv(id);if(wtSt(x)!=='open'){WT.loading=false;watchRender();return}
 NET.acct.srv=id;acctSave();NET.players=[];NET.plAt=0;WB.srv={};WB.cache.clear();if(typeof AR!=='undefined')AR.board=null;
 WT.loading=true;watchRender();
 const ok=await netWorld(true);if(WT.sv!==id)return;
 if(!ok||!BOTS.W||!BOTS.W.length){WT.loading=false;watchRender();toast(T('Gagal memuat server. Coba lagi.'),1);return}
 if(typeof BLM!=='undefined')BLM.L=null;await netPlayers(true);if(WT.sv!==id)return;if(typeof gLoad==='function')await gLoad(true);if(WT.sv!==id)return;
 botsWarm(()=>{if(WT.sv!==id)return;WT.loading=false;WT.sig=botsSig();watchTopSave(id);watchRender()})}
function watchTopSave(id){try{const L=botsList().filter(e=>!e.me).sort((a,b)=>b.cp-a.cp);WT.top[id]={at:Date.now(),n:L.length,on:L.filter(e=>e.online).length,cp:L.slice(0,3).map(e=>({name:e.name,cp:e.cp,lv:e.lv,top:e.top}))}}catch(e){}}

/* ---------- papan CP / Level / Arena ---------- */
function watchBoard(){const now=Date.now();if(WT.tab==='ar'){if(typeof AR!=='undefined'&&WT.sig!==botsSig())AR.board=null;return arBoard(now).filter(e=>!e.me).slice().sort((a,b)=>b.pts-a.pts||b.cp-a.cp)}
 const L=botsList(now).filter(e=>!e.me);return L.sort(WT.tab==='cp'?(a,b)=>b.cp-a.cp||b.lv-a.lv:(a,b)=>b.lv-a.lv||b.cp-a.cp)}
function wtRow(e,k,val,sub){const md=k<3?` m${k+1}`:'';return`<div class="rkrow wvrow"><span class="rkn${md}">${k+1}</span><span class="rkav">${e.top?`<img class="px" src="${portrait(e.top)}">`:''}${e.online?'<i class="on"></i>':''}</span>
 <span class="rknm"><b>${e.vip?`<i class="vip v${Math.min(7,e.vip)}">VIP${e.vip}</i>`:''}${esc(e.name)}${WT.mark&&e.h?` <em class="wvreal">${T('ASLI')}</em>`:''}</b><small>${sub!=null?sub:e.online?T('Online'):T('Aktif {t}',{t:agoMs(Date.now()-e.last)})}</small></span>
 <span class="rkv">${val}</span></div>`}
function wtVal(e){return WT.tab==='ar'?`<b>${lgIc(e.pts,14)} ${fmt(e.pts)}</b><small>CP ${fmt(e.cp)}</small>`:WT.tab==='cp'?`<b>${fmt(e.cp)}</b><small>Lv ${e.lv}</small>`:`<b>Lv ${e.lv}</b><small>CP ${fmt(e.cp)}</small>`}
function watchBoardHTML(x){if(WT.loading||!botsWarmOk())return`<p class="wvload">${T('Menghitung papan peringkat {s}...',{s:'S'+x.id+' · '+esc(x.name)})}</p>`;
 const L=watchBoard(),on=L.filter(e=>e.online).length;
 return`<div class="rkinfo"><span><em class="rksrv">S${x.id} · ${esc(x.name)}</em> <b>${fmt(L.length)}</b> ${WT.tab==='ar'?T('peserta'):T('pemain')}</span><span><i class="on"></i><b>${fmt(on)}</b> ${T('online')}</span></div>
 <div class="wvlist">${L.slice(0,WT.n).map((e,k)=>wtRow(e,k,wtVal(e))).join('')||`<p class="wvload">${T('Belum ada peserta.')}</p>`}</div>
 ${L.length>WT.n?`<div class="mrow"><button class="btn blue" data-act="wtMore">${T('Tampilkan {n} berikutnya',{n:Math.min(100,L.length-WT.n)})}</button></div>`:''}`}

/* ---------- raid Bos Dunia: yang sedang berlangsung & yang sudah selesai (2 hari terakhir) + berikutnya ---------- */
function watchRaidSlots(x,now=Date.now()){const C=WB_CFG,d=wibDay(now),out=[];let next=null;
 for(let dd=d-2;dd<=d+1;dd++)for(const h of C.slots){const t0=wbSlotT(dd,h);if(t0<C.from||wbEnd(t0)<x.opened)continue;if(t0<=now)out.push(t0);else if(next==null||t0<next)next=t0}
 return{done:out.sort((a,b)=>b-a),next}}
const wtWhen=t=>{const d=new Date(t),p=n=>String(n).padStart(2,'0'),days=[T('Min'),T('Sen'),T('Sel'),T('Rab'),T('Kam'),T('Jum'),T('Sab')];return`${days[d.getDay()]} ${p(d.getDate())}/${p(d.getMonth()+1)} ${p(d.getHours())}:${p(d.getMinutes())}`};
const wtLeft=ms=>{const m=Math.max(1,Math.round(ms/6e4));return m>=60?T('{h} jam {m} menit',{h:Math.floor(m/60),m:m%60}):T('{n} menit',{n:m})};
const wtMS=ms=>{const s=Math.max(0,Math.round(ms/1e3));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function watchRaidListHTML(x){if(WT.loading||!botsWarmOk())return`<p class="wvload">${T('Memuat dunia {s}...',{s:'S'+x.id+' · '+esc(x.name)})}</p>`;
 const now=Date.now(),R=watchRaidSlots(x,now);
 const item=t0=>{const live=now<wbEnd(t0),b=wbBoss(t0),c=WT.rb&&WT.rb.t0===t0?WT.rb.b.st:null;
  const st=live?`<i class="wvst live">● ${T('BERLANGSUNG')}</i>`:c?(c.killT!=null?`<i class="wvst ok">${T('TUMBANG {t}',{t:wtMS(c.killT-t0)})}</i>`:`<i class="wvst run">${T('KABUR')}</i>`):`<i class="wvst done">${T('SELESAI')}</i>`;
  return`<button class="wvraid${WT.raid===t0?' on':''}" data-act="wtRaid" data-arg="${t0}"><b>${esc(T(b.n))}</b><small>${wtWhen(t0)}</small>${st}</button>`};
 return`${R.next?`<div class="wvnext">⏰ ${T('Raid berikutnya')}: <b>${esc(T(wbBoss(R.next).n))}</b> · ${wtWhen(R.next)} (${T('{t} lagi',{t:wtLeft(R.next-now)})})</div>`:''}
 <div class="wvraids">${R.done.map(item).join('')||`<p class="wvload">${T('Belum ada raid di server ini.')}</p>`}</div>
 <div id="wtRaidBody">${watchRaidBodyHTML()}</div>`}
function watchRaidBodyHTML(){if(WT.raid==null)return`<p class="wvload">${T('Pilih raid di atas untuk melihat papan damage.')}</p>`;
 if(WT.rload||!WT.rb||WT.rb.t0!==WT.raid)return`<p class="wvload">${T('Menghitung papan raid...')}</p>`;
 const {t0,b,gb}=WT.rb,st=b.st,now=Date.now(),live=now<wbEnd(t0),boss=wbBoss(t0),pct=Math.round(st.p*1000)/10;
 const gv=WT.rv||'g',pc=v=>(Math.round(v*1000)/10).toString().replace('.',',');
 const head=st.killT!=null&&now>=st.killT?T('Tumbang dalam {t}',{t:wtMS(st.killT-t0)}):live?T('Sisa waktu {t}',{t:wtMS(wbEnd(t0)-now)}):T('Kabur — HP tersisa {p}%',{p:pct});
 return`<div class="wvboss"><div><b>${esc(T(boss.n))}</b><small>${wtWhen(t0)} · ${fmt(b.L.length)} ${T('peserta')}</small></div><span>${head}</span></div>
 <div class="wvhp"><i style="width:${Math.max(0,Math.min(100,st.p*100))}%"></i><em>${fmt(Math.round(st.left))} / ${fmt(st.hp)}</em></div>
 <div class="mtabs gsub"><button class="btn sm ${gv==='g'?'':'blue'}" data-act="wtRaidV" data-arg="g">${T('Guild')} (${gb?gb.L.length:0})</button><button class="btn sm ${gv==='i'?'':'blue'}" data-act="wtRaidV" data-arg="i">${T('Individu')} (${b.L.length})</button></div>
 ${gv==='g'&&gb?`<div class="wvlist">${gb.L.concat(gb.solo.n?[gb.solo]:[]).map((g,k)=>{const top=g.mem.slice().sort((x,y)=>y.dmg-x.dmg)[0];return`<div class="rkrow wvrow"><span class="rkn${g.gid&&k<3?' m'+(k+1):''}">${g.gid?g.rank:'–'}</span><span class="rkav">${g.gid&&typeof gIc==='function'?gIc(g,30):''}</span><span class="rknm"><b>${esc(g.name)}</b><small>${T('{n} penyerang',{n:g.n})}${top?' · MVP '+esc(top.name):''}</small></span><span class="rkv"><b>${fmt(g.dmg)}</b><small>${T('{p}% damage',{p:pc(g.dmg/Math.max(1,st.hp))})}</small></span></div>`}).join('')||`<p class="wvload">${T('Belum ada peserta.')}</p>`}</div>`:
 `<div class="wvlist">${b.L.slice(0,100).map((e,k)=>wtRow({name:e.name,h:e.uid,online:live&&!e.dn,top:e.bot!=null&&typeof botSum==='function'?botSum(e.bot).top:null},k,`<b>${fmt(e.dmg)}</b><small>CP ${fmt(e.cp)}</small>`,live?(e.dn?T('Bangkit {n} dtk',{n:e.dn}):T('Bertarung')):T('{p}% damage',{p:pc(e.dmg/Math.max(1,st.hp))}))).join('')||`<p class="wvload">${T('Belum ada peserta.')}</p>`}</div>`}`}
async function watchRaidOpen(t0){t0=+t0;WT.raid=t0;WT.rload=true;const R=$('#wtRaidBody');if(R)R.innerHTML=watchRaidBodyHTML();document.querySelectorAll('.wvraid').forEach(e=>e.classList.toggle('on',+e.dataset.arg===t0));
 await wbPull(t0,true);await sleep(30);if(WT.raid!==t0)return;
 try{WT.rb={t0,b:wbBoard(t0,Date.now()),gb:wbGBoard(t0,Date.now()),at:Date.now()}}catch(e){WT.rb=null;console.error(e)}WT.rload=false;watchRender()}

/* ---------- peringkat guild server ini ---------- */
function watchGuildHTML(x){if(WT.loading||!botsWarmOk()||typeof gReady!=='function'||!gReady())return`<p class="wvload">${T('Memuat guild {s}...',{s:'S'+x.id+' · '+esc(x.name)})}</p>`;
 return`<div class="mtabs gsub"><button class="btn sm ${gRankBy==='cp'?'':'blue'}" data-act="wtGBy" data-arg="cp">${T('Total CP')}</button><button class="btn sm ${gRankBy==='lv'?'':'blue'}" data-act="wtGBy" data-arg="lv">${T('Level')}</button></div>
 <div class="rkinfo"><span><em class="rksrv">S${x.id} · ${esc(x.name)}</em> <b>${GS.G.size}</b> ${T('guild')}</span><span><b>${fmt(GS.mem.size)}</b> ${T('anggota')}</span></div><div class="wvlist">${gRankRows(gRankBy,100,'')}</div>`}
/* ---------- ringkasan semua server ---------- */
function watchAllHTML(){if(!WT.list.length)return`<p class="wvload">${WT.at?T('Belum ada server.'):T('Memuat daftar server...')}</p>`;
 return`<div class="wvall">${WT.list.map(x=>{const s=wtSt(x),tp=WT.top[x.id];
  return`<button class="wvcard s-${s}" data-act="wtSrv" data-arg="${x.id}"><div class="wvch"><b>S${x.id} · ${esc(x.name)}</b>${wtBadge(x)}</div>
  ${s==='list'?`<small>${T('Baru terdaftar — belum dirilis.')}</small>`:s==='soon'?`<small>${T('Dibuka {t}',{t:wtWhen(x.opened)})} · ${T('pra-registrasi')}</small>`
  :`<small>${fmt(x.n)}/${fmt(x.cap)} ${T('pemain')} · +${fmt(x.d24)} ${T('24 jam')} · ${T('hari ke-{n}',{n:wtDay(x)})}${x.merged?' · '+T('gabungan'):''}</small>
   ${tp?`<div class="wvtop3">${tp.cp.map((e,k)=>`<span><i>#${k+1}</i>${esc(e.name)} <em>${fmt(e.cp)}</em></span>`).join('')}</div>`:`<small class="wvmut">${T('Ketuk untuk melihat papan peringkat')}</small>`}`}</button>`}).join('')}</div>`}

function watchRender(){const el=document.getElementById('watch');if(!el||!el.classList.contains('on'))return;const x=WT.sv==='all'?null:wtSrv(WT.sv),sc=$('#wtMain'),top=sc?sc.scrollTop:0;
 const s=x?wtSt(x):'';
 el.innerHTML=`<header class="wvtop"><div><b>👁 ${T('Dashboard Penonton')}</b><small>${esc(NET.acct?NET.acct.u:'')} · ${T('hanya melihat')}</small></div>
  <button class="wvbtn${WT.mark?' on':''}" data-act="wtMark" title="${T('Tandai pemain asli')}">👤 ${T('Asli')}</button><button class="wvbtn" data-act="wtOut">${T('Keluar')}</button></header>
 <nav class="wvsrv"><button class="${WT.sv==='all'?'on':''}" data-act="wtSrv" data-arg="all">${T('Semua Server')}</button>${WT.list.map(y=>`<button class="${WT.sv===y.id?'on':''} s-${wtSt(y)}" data-act="wtSrv" data-arg="${y.id}">S${y.id}<small>${esc(y.name)}</small></button>`).join('')}</nav>
 ${x&&s==='open'?`<nav class="wvtab">${WT_TABS.map(([k,l])=>`<button class="${WT.tab===k?'on':''}" data-act="wtTab" data-arg="${k}">${T(l)}</button>`).join('')}</nav>`:''}
 <main id="wtMain">${!x?watchAllHTML():s!=='open'?`<div class="srvdeny"><div class="sdic">${s==='soon'?'⏰':'📋'}</div><h3>S${x.id} · ${esc(x.name)}</h3><p>${s==='soon'?T('Dibuka {t}. Papan peringkat muncul setelah server buka.',{t:'<b>'+wtWhen(x.opened)+'</b>'}):T('Server ini baru terdaftar dan belum dirilis.')}</p></div>`
  :WT.tab==='wb'?watchRaidListHTML(x):WT.tab==='gd'?watchGuildHTML(x):watchBoardHTML(x)}</main>`;
 const m=$('#wtMain');if(m&&top)m.scrollTop=top}

// segarkan berkala: daftar server (ringkasan), papan (online/CP berubah), raid yang sedang berlangsung
async function watchTick(){if(!document.getElementById('watch')||!watchMode())return watchClose();
 if(document.hidden)return;
 if(WT.sv==='all'){await watchSrvList();watchRender();return}
 if(WT.loading)return;
 if(WT.tab==='wb'){if(WT.raid!=null&&Date.now()<wbEnd(WT.raid)+6e4){await wbPull(WT.raid,true);try{WT.rb={t0:WT.raid,b:wbBoard(WT.raid,Date.now()),gb:wbGBoard(WT.raid,Date.now()),at:Date.now()}}catch(e){}watchRender()}return}
 netPlayers();if(Date.now()-(NET.worldAt||0)>6e4)netWorld();watchTopSave(WT.sv);watchRender()}

Object.assign(ACT,{
 wtSrv:id=>{sfx('tab');watchPick(id==='all'?'all':+id)},
 wtTab:k=>{sfx('tab');WT.tab=k;WT.n=100;watchRender()},
 wtMore:()=>{WT.n+=100;watchRender()},
 wtRaid:t0=>{sfx('tap');watchRaidOpen(+t0)},
 wtRaidV:v=>{sfx('tap');WT.rv=v;const R=$('#wtRaidBody');if(R)R.innerHTML=watchRaidBodyHTML()},
 wtMark:()=>{WT.mark=!WT.mark;sfx('tab');watchRender()},
 wtGBy:k=>{gRankBy=k;sfx('tab');watchRender()},
 wtOut:()=>confirmBox(T('Keluar dari akun penonton?'),()=>{watchClose();netLogout()},T('Keluar')),
});
