/* =====================================================================
   OBROLAN DUNIA — pemain sungguhan (server: bank-worker/src/game.js /api/wc)
   Pesan pemain asli + (bila Mode AI dinyalakan dari Telegram: /ai on) pesan para bot yang sedang online,
   ditulis Claude Haiku 5.5 di server dan disimpan bersama -> semua pemain melihat obrolan yang sama.
   Game yang sedang dibuka mengirim konteks (bot online + data aslinya); server membatasi ±1 adegan per 75 dtk.
   Strip 2 pesan terakhir di beranda + panel obrolan penuh (modal). Gaya: css/chat.css
   ===================================================================== */
ICON.chat=pxIcon(K=>{K.rect(2,3,12,8,'#fff6e0');K.rect(1,4,1,6,'#fff6e0');K.rect(14,4,1,6,'#fff6e0');K.rect(4,11,3,2,'#fff6e0');K.rect(4,13,1,1,'#fff6e0');
 K.rect(4,6,2,2,'#c98a1a');K.rect(7,6,2,2,'#c98a1a');K.rect(10,6,2,2,'#c98a1a')});
const CHQ=['halo semua','gg','wkwk','ada tips?','lagi gacha','pity berapa?','siapa top 1?','bye'];
const WC={list:[],since:0,at:0,busy:false,seen:0,aiNext:0,aiBusy:false};
let chatOpen=false,chatSig='';
const chTime=t=>{const d=new Date(t+BOT_CFG.TZ*36e5);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')};
try{WC.seen=+localStorage.getItem('aster_wcseen')||0}catch(e){}
async function wcFetch(){if(WC.busy)return;WC.busy=true;WC.at=Date.now();
 try{const o=await api('/api/wc?since='+WC.since);if(o.ok){NET.ai=!!o.ai;if(o.list.length){const have=new Set(WC.list.map(m=>m.id));WC.list=WC.list.concat(o.list.filter(m=>!have.has(m.id))).sort((a,b)=>a.ts-b.ts||a.id-b.id).slice(-150);WC.since=WC.list[WC.list.length-1].ts}}}finally{WC.busy=false}}
// bot pengirim pesan (akun bot di server) -> VIP & potret dari simulasi bot
function wcBot(m){const i=typeof botIdxOf==='function'?botIdxOf(m.uid):-1;return i>=0&&i<botsVisible()?i:-1}
function wcVip(m){const i=wcBot(m);return i>=0?botState(i).stats.vip:m.vip}
function wcTop(m){const i=wcBot(m);if(i>=0){const s=botState(i);return s.fav||s.team[0]}return m.top}
/* ---- Mode AI: minta server menulis adegan obrolan / balasan dari bot yang sedang online ---- */
function wcAiBody(kind){const now=Date.now(),d=new Date(now+BOT_CFG.TZ*36e5),HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
 const on=chOnline(now).filter(i=>!botHidden(i)&&botUid(i)),talk=on.filter(i=>chPersona(i).chat>0);
 const recent=[...new Set(WC.list.filter(m=>now-m.ts<15*6e4).map(wcBot).filter(i=>i>=0&&on.includes(i)))].slice(-3);
 const r=bRng(now>>>0),pool=talk.map(i=>[i,(chPersona(i).chat+.2)*r()]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
 const cands=chCandsDesc([...new Set([...recent,...pool])].slice(0,7),now).map((c,k,arr)=>c);const idx=[...new Set([...recent,...pool])].slice(0,7);cands.forEach((c,k)=>c.uid=botUid(idx[k]));
 const humans=NET.players.filter(p=>p.on&&!(NET.acct&&p.uid===NET.acct.uid)).map(p=>`${p.u} (Lv ${p.lv})`).join(', ');
 return{tok:netTok(),kind,when:`${HARI[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth()+1} ${chTime(now)}`,online:wcOnline(),world:chWorldTxt(now),humans,cands,
  player:loggedIn()?{name:NET.acct.u,info:chPlayerInfo(),acts:(CHAT.mem.acts||[]).filter(a=>now-a.t<6*36e5).map(a=>`${chTime(a.t)} ${a.s}`),screen:chatOpen?'Obrolan Dunia (membaca chat)':SCR_N[typeof tab!=='undefined'?tab:'home']||''}:null,n:chatOpen?'4-8':'3-6'}}
async function wcAi(kind){if(!NET.ai||WC.aiBusy||!botsWarmOk()||document.hidden)return;WC.aiBusy=true;
 try{chatInit();const b=wcAiBody(kind);if(b.cands.length<2){WC.aiNext=Date.now()+6e4;return}const o=await api('/api/wc/ai',b);
  if(kind==='scene')WC.aiNext=Date.now()+(o.next||0)+15e3+Math.random()*2e4;if(o.ok)setTimeout(wcFetch,2500)}catch(e){WC.aiNext=Date.now()+6e4}finally{WC.aiBusy=false}}
const wcMine=m=>loggedIn()&&m.uid===NET.acct.uid;
const chAt=m=>!wcMine(m)&&loggedIn()&&m.txt.toLowerCase().includes('@'+NET.acct.u.toLowerCase());
function chRow(m,prev){const me=wcMine(m),same=prev&&prev.uid===m.uid&&m.ts-prev.ts<3*6e4,nm=esc(m.u),v=wcVip(m),vip=v?`<i class="vip v${Math.min(7,v)}">VIP${v}</i>`:'';
 const top=wcTop(m),av=top&&HD[top]?`<img class="px" src="${portrait(top)}">`:'';
 if(me)return`<div class="chm self${same?' cont':''}">${same?'':`<div class="chn"><small>${chTime(m.ts)}</small>${vip}<b>${nm}</b></div>`}<p>${esc(m.txt)}</p></div>`;
 return`<div class="chm${same?' cont':''}${chAt(m)?' at':''}">${same?'<span class="chav sp"></span>':`<button class="chav" data-act="profView" data-arg="${m.uid}">${av}</button>`}
  <div class="chb">${same?'':`<div class="chn"><button data-act="profView" data-arg="${m.uid}">${vip}<b>${nm}</b></button><small>${chTime(m.ts)}</small></div>`}<p>${esc(m.txt)}</p></div></div>`}
function chListHTML(L){if(!L.length)return`<p class="sub chempty">${WC.at?T('Belum ada obrolan. Sapa yang lain!'):T('Memuat obrolan...')}</p>`;return L.map((m,k)=>chRow(m,L[k-1])).join('')}
// jumlah online = bot yang sedang bermain (jadwal sesi bot, sama untuk semua pemain) + pemain asli online (+ kamu)
function wcOnline(){let n=0;try{if(BOTS.ready&&botsVisible())n=chOnline(Date.now()).filter(i=>!botHidden(i)).length}catch(e){}
 return n+NET.players.filter(p=>p.on&&!(NET.acct&&p.uid===NET.acct.uid)).length+1}
function openChat(){chatOpen=true;wcFetch().then(()=>chatRefresh(true));netPlayers();
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3><img class="ix" src="${ICON.wchat||ICON.chat}" style="width:24px;height:24px"> ${T('Obrolan Dunia')}</h3><div class="chhd"><small><i class="on"></i><b id="chOn">${wcOnline()}</b> ${T('pemain online')}</small></div>
 <div class="chlist" id="chList"></div>
 ${!featOK('chat')?`<div class="chguest">${ic('lock',14)} ${T('Kirim pesan')} · ${featReq('chat')}</div>`:loggedIn()?`<div class="chq">${CHQ.map(q=>`<button data-act="chatQuick" data-arg="${esc(q)}">${esc(q)}</button>`).join('')}</div>
 <form class="chin" id="chForm"><input id="chIn" maxlength="120" autocomplete="off" placeholder="${T('Ketik pesan...')}"><button class="btn" type="submit">${T('Kirim')}</button></form>`
 :`<div class="chguest">${T('Masuk dengan akun untuk ikut mengobrol.')} <button class="btn green" data-act="accLink">${T('Daftarkan Akun')}</button></div>`}`);
 $('#modal .mbox').classList.add('chatbox');const f=$('#chForm');
 if(f)f.onsubmit=async e=>{e.preventDefault();const i=$('#chIn'),v=(i.value||'').trim();if(!v)return;i.value='';sfx('tap');
  const o=await api('/api/wc',{tok:netTok(),txt:v});if(!o.ok){i.value=v;toast(o.e==='fast'?T('Pelan-pelan, tunggu sebentar.'):netErr(o.e));return}await wcFetch();chatSig='';chatRefresh(true);if(NET.ai)wcAi('reply')};
 chatSig='';chatRefresh(true)}
function chatRefresh(force){const box=$('#chList');if(!box){chatOpen=false;return}const L=WC.list,last=L[L.length-1],sig=L.length+':'+(last?last.id:'');
 const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;
 if(sig!==chatSig||force){chatSig=sig;box.innerHTML=chListHTML(L);if(force||nearBottom)box.scrollTop=box.scrollHeight}
 const on=$('#chOn');if(on)on.textContent=wcOnline();if(last){WC.seen=last.ts;try{localStorage.setItem('aster_wcseen',WC.seen)}catch(e){}}}
/* ---- strip di beranda ---- */
function chatStripHTML(){const L=WC.list.slice(-2),n=WC.list.filter(m=>m.ts>WC.seen&&!wcMine(m)).length;
 return`<img class="ix" src="${ICON.chat}"><span class="chsl">${L.length?L.map(m=>`<span><b>${esc(m.u)}:</b> ${esc(m.txt)}</span>`).join(''):`<span>${T('Obrolan Dunia')}</span>`}</span>${n?`<i class="dot n">${n>99?'99+':n}</i>`:''}`}
function chatTick(){const now=Date.now(),L=document.getElementById('login');if(L&&L.classList.contains('on'))return;
 if(NET.ai&&now>WC.aiNext&&!WC.aiBusy){if(!WC.aiNext)WC.aiNext=now+5e3+Math.random()*1e4;else wcAi('scene')}
 if(chatOpen&&$('#chList')){if(now-WC.at>2500)wcFetch().then(()=>chatRefresh());}
 else{chatOpen=false;if(now-WC.at>(NET.ai?8e3:20e3)||(NET.wc>WC.since&&now-WC.at>3e3))wcFetch().then(()=>{const m=WC.list.filter(x=>x.ts>WC.seen&&chAt(x)).pop();if(m&&m.id>(WC.atSeen||0)){WC.atSeen=m.id;toast(T('{n} menyebutmu di obrolan',{n:m.u}))}})}
 const st=$('#hchat');if(st)st.innerHTML=chatStripHTML()}
setTimeout(()=>setInterval(chatTick,1500),3500);
Object.assign(ACT,{chat:()=>openChat(),chatQuick:q=>{const i=$('#chIn');if(i){i.value=q;i.focus()}}});
