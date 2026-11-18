/* =====================================================================
   OBROLAN DUNIA — pemain sungguhan (server: bank-worker/src/game.js /api/wc)
   Sejak 18 Nov 2026 obrolan bot & Mode AI dimatikan; yang tampil hanya pesan pemain asli.
   Strip 2 pesan terakhir di beranda + panel obrolan penuh (modal). Gaya: css/chat.css
   ===================================================================== */
ICON.chat=pxIcon(K=>{K.rect(2,3,12,8,'#fff6e0');K.rect(1,4,1,6,'#fff6e0');K.rect(14,4,1,6,'#fff6e0');K.rect(4,11,3,2,'#fff6e0');K.rect(4,13,1,1,'#fff6e0');
 K.rect(4,6,2,2,'#c98a1a');K.rect(7,6,2,2,'#c98a1a');K.rect(10,6,2,2,'#c98a1a')});
const CHQ=['halo semua','gg','wkwk','ada tips?','lagi gacha','pity berapa?','siapa top 1?','bye'];
const WC={list:[],last:0,at:0,busy:false,seen:0};
let chatOpen=false,chatSig='';
const chTime=t=>{const d=new Date(t+BOT_CFG.TZ*36e5);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')};
try{WC.seen=+localStorage.getItem('aster_wcseen')||0}catch(e){}
async function wcFetch(){if(WC.busy)return;WC.busy=true;WC.at=Date.now();
 try{const o=await api('/api/wc?after='+WC.last);if(o.ok&&o.list.length){WC.list=WC.list.concat(o.list).slice(-150);WC.last=WC.list[WC.list.length-1].id}}finally{WC.busy=false}}
const wcMine=m=>loggedIn()&&m.uid===NET.acct.uid;
const chAt=m=>!wcMine(m)&&loggedIn()&&m.txt.toLowerCase().includes('@'+NET.acct.u.toLowerCase());
function chRow(m,prev){const me=wcMine(m),same=prev&&prev.uid===m.uid&&m.ts-prev.ts<3*6e4,nm=esc(m.u),vip=m.vip?`<i class="vip v${Math.min(7,m.vip)}">VIP${m.vip}</i>`:'';
 const av=m.top&&HD[m.top]?`<img class="px" src="${portrait(m.top)}">`:'';
 if(me)return`<div class="chm self${same?' cont':''}">${same?'':`<div class="chn"><small>${chTime(m.ts)}</small>${vip}<b>${nm}</b></div>`}<p>${esc(m.txt)}</p></div>`;
 return`<div class="chm${same?' cont':''}${chAt(m)?' at':''}">${same?'<span class="chav sp"></span>':`<button class="chav" data-act="profView" data-arg="${m.uid}">${av}</button>`}
  <div class="chb">${same?'':`<div class="chn"><button data-act="profView" data-arg="${m.uid}">${vip}<b>${nm}</b></button><small>${chTime(m.ts)}</small></div>`}<p>${esc(m.txt)}</p></div></div>`}
function chListHTML(L){if(!L.length)return`<p class="sub chempty">${WC.at?T('Belum ada obrolan. Sapa yang lain!'):T('Memuat obrolan...')}</p>`;return L.map((m,k)=>chRow(m,L[k-1])).join('')}
const wcOnline=()=>NET.players.filter(p=>p.on).length+(loggedIn()&&!NET.players.some(p=>p.uid===NET.acct.uid&&p.on)?1:0);
function openChat(){chatOpen=true;wcFetch().then(()=>chatRefresh(true));netPlayers();
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3><img class="ix" src="${ICON.wchat||ICON.chat}" style="width:24px;height:24px"> ${T('Obrolan Dunia')}</h3><div class="chhd"><small><i class="on"></i><b id="chOn">${wcOnline()}</b> ${T('pemain online')}</small></div>
 <div class="chlist" id="chList"></div>
 ${!featOK('chat')?`<div class="chguest">${ic('lock',14)} ${T('Kirim pesan')} · ${featReq('chat')}</div>`:loggedIn()?`<div class="chq">${CHQ.map(q=>`<button data-act="chatQuick" data-arg="${esc(q)}">${esc(q)}</button>`).join('')}</div>
 <form class="chin" id="chForm"><input id="chIn" maxlength="120" autocomplete="off" placeholder="${T('Ketik pesan...')}"><button class="btn" type="submit">${T('Kirim')}</button></form>`
 :`<div class="chguest">${T('Masuk dengan akun untuk ikut mengobrol.')} <button class="btn green" data-act="accLink">${T('Daftarkan Akun')}</button></div>`}`);
 $('#modal .mbox').classList.add('chatbox');const f=$('#chForm');
 if(f)f.onsubmit=async e=>{e.preventDefault();const i=$('#chIn'),v=(i.value||'').trim();if(!v)return;i.value='';sfx('tap');
  const o=await api('/api/wc',{tok:netTok(),txt:v});if(!o.ok){i.value=v;toast(o.e==='fast'?T('Pelan-pelan, tunggu sebentar.'):netErr(o.e));return}await wcFetch();chatSig='';chatRefresh(true)};
 chatSig='';chatRefresh(true)}
function chatRefresh(force){const box=$('#chList');if(!box){chatOpen=false;return}const L=WC.list,last=L[L.length-1],sig=L.length+':'+(last?last.id:'');
 const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;
 if(sig!==chatSig||force){chatSig=sig;box.innerHTML=chListHTML(L);if(force||nearBottom)box.scrollTop=box.scrollHeight}
 const on=$('#chOn');if(on)on.textContent=wcOnline();if(last){WC.seen=last.id;try{localStorage.setItem('aster_wcseen',WC.seen)}catch(e){}}}
/* ---- strip di beranda ---- */
function chatStripHTML(){const L=WC.list.slice(-2),n=Math.max(0,(NET.wc||WC.last)-WC.seen);
 return`<img class="ix" src="${ICON.chat}"><span class="chsl">${L.length?L.map(m=>`<span><b>${esc(m.u)}:</b> ${esc(m.txt)}</span>`).join(''):`<span>${T('Obrolan Dunia')}</span>`}</span>${n?`<i class="dot n">${n>99?'99+':n}</i>`:''}`}
function chatTick(){const now=Date.now(),L=document.getElementById('login');if(L&&L.classList.contains('on'))return;
 if(chatOpen&&$('#chList')){if(now-WC.at>2500)wcFetch().then(()=>chatRefresh());}
 else{chatOpen=false;if(now-WC.at>20e3||(NET.wc>WC.last&&now-WC.at>3e3))wcFetch().then(()=>{const m=WC.list.filter(x=>x.id>WC.seen&&chAt(x)).pop();if(m&&m.id>(WC.atSeen||0)){WC.atSeen=m.id;toast(T('{n} menyebutmu di obrolan',{n:m.u}))}})}
 const st=$('#hchat');if(st)st.innerHTML=chatStripHTML()}
setTimeout(()=>setInterval(chatTick,1500),3500);
Object.assign(ACT,{chat:()=>openChat(),chatQuick:q=>{const i=$('#chIn');if(i){i.value=q;i.focus()}}});
