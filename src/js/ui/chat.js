/* =====================================================================
   OBROLAN DUNIA — tampilan (mesin: systems/chat.js, gaya: css/chat.css)
   Strip 2 pesan terakhir di beranda + panel obrolan penuh (modal).
   ===================================================================== */
ICON.chat=pxIcon(K=>{K.rect(2,3,12,8,'#fff6e0');K.rect(1,4,1,6,'#fff6e0');K.rect(14,4,1,6,'#fff6e0');K.rect(4,11,3,2,'#fff6e0');K.rect(4,13,1,1,'#fff6e0');
 K.rect(4,6,2,2,'#c98a1a');K.rect(7,6,2,2,'#c98a1a');K.rect(10,6,2,2,'#c98a1a')});
const CHQ=['halo semua','gg','wkwk','ada tips?','lagi gacha','pity berapa?','siapa top 1?','bye'];
let chatOpen=false,chatSig='';
const chTime=t=>{const d=new Date(t+BOT_CFG.TZ*36e5);return String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0')};
function chMine(m){return!m.me&&m.ment&&S.name&&m.text.toLowerCase().includes('@'+S.name.toLowerCase())}
function chAvatar(m){if(m.me){const id=S.team.find(Boolean);return id?`<img class="px" src="${portrait(id)}">`:''}if(m.i==null||m.i>=botsVisible())return'';const s=botState(m.i);return s.fav?`<img class="px" src="${portrait(s.fav)}">`:''}
function chVip(m){if(m.me){const v=vipOf(S.iap&&S.iap.spent||0);return v?`<i class="vip v${Math.min(7,v)}">VIP${v}</i>`:''}if(m.i==null||m.i>=botsVisible())return'';const v=botState(m.i).stats.vip;return v?`<i class="vip v${Math.min(7,v)}">VIP${v}</i>`:''}
function chRow(m,prev){if(m.sys)return`<div class="chsys">${m.hero&&HD[m.hero]?`<img class="px" src="${portrait(m.hero)}">`:''}<span>${esc(m.text)}</span></div>`;
 const same=prev&&!prev.sys&&prev.me===m.me&&prev.i===m.i&&m.t-prev.t<3*6e4,nm=esc(chName(m));
 if(m.me)return`<div class="chm self${same?' cont':''}">${same?'':`<div class="chn"><small>${chTime(m.t)}</small>${chVip(m)}<b>${nm}</b></div>`}<p>${esc(m.text)}</p></div>`;
 return`<div class="chm${same?' cont':''}${chMine(m)?' at':''}">${same?'<span class="chav sp"></span>':`<button class="chav" data-act="chatBot" data-arg="${m.i}">${chAvatar(m)}</button>`}
  <div class="chb">${same?'':`<div class="chn"><button data-act="chatBot" data-arg="${m.i}">${chVip(m)}<b>${nm}</b></button><small>${chTime(m.t)}</small></div>`}<p>${esc(m.text)}</p></div></div>`}
function chListHTML(L){if(!L.length)return`<p class="sub chempty">${botsWarmOk()?T('Belum ada obrolan. Sapa yang lain!'):T('Memuat obrolan...')}</p>`;return L.map((m,k)=>chRow(m,L[k-1])).join('')}
function chTypingHTML(){const L=chatTyping();if(!L.length)return'';const n=L.map(i=>esc(botName(i)));return`<span class="dots"><i></i><i></i><i></i></span>`+(n.length>1?T('{a} dan {b} sedang mengetik...',{a:n[0],b:n.length>2?T('{n} lainnya',{n:n.length-1}):n[1]}):T('{n} sedang mengetik...',{n:n[0]}))}
function openChat(){chatInit();chatOpen=true;try{chatPump()}catch(e){}
 modal(`<div class="chhd"><img class="ix" src="${ICON.chat}"><div><h3>${T('Obrolan Dunia')}</h3><small><i class="on"></i><b id="chOn">${chWorld().online}</b> ${T('online')}</small></div><button class="btn red sm" data-act="closeModal">✕</button></div>
 <div class="chlist" id="chList"></div><div class="chtype" id="chType"></div>
 <div class="chq">${CHQ.map(q=>`<button data-act="chatQuick" data-arg="${esc(q)}">${esc(q)}</button>`).join('')}</div>
 <form class="chin" id="chForm"><input id="chIn" maxlength="100" autocomplete="off" placeholder="${T('Ketik pesan...')}"><button class="btn" type="submit">${T('Kirim')}</button></form>`);
 $('#modal .mbox').classList.add('chatbox');$('#chForm').onsubmit=e=>{e.preventDefault();const v=$('#chIn').value;if(chatSend(v)){$('#chIn').value='';chatSig='';chatRefresh(true);sfx('tap')}};
 chatSig='';chatRefresh(true)}
function chatRefresh(force){const box=$('#chList');if(!box){chatOpen=false;return}const L=chatVisible(),last=L[L.length-1],sig=L.length+':'+(last?last.id:'');
 const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;
 if(sig!==chatSig){chatSig=sig;box.innerHTML=chListHTML(L);if(force||nearBottom)box.scrollTop=box.scrollHeight}
 const ty=$('#chType');if(ty)ty.innerHTML=chTypingHTML();const on=$('#chOn');if(on)on.textContent=chWorld().online;
 CHAT.seenT=Date.now();CHAT.mem.seenT=CHAT.seenT;CHAT.unread=0;CHAT.mention=0}
/* ---- strip di beranda ---- */
function chatStripHTML(){const L=chatVisible().filter(m=>!m.sys||m.me).slice(-2);
 const n=CHAT.unread,at=CHAT.mention;
 return`<img class="ix" src="${ICON.chat}"><span class="chsl">${L.length?L.map(m=>`<span><b>${esc(chName(m))}:</b> ${esc(m.text)}</span>`).join(''):`<span>${T('Obrolan Dunia')}</span>`}</span>${at?'<i class="dot n at">@</i>':n?`<i class="dot n">${n>99?'99+':n}</i>`:''}`}
function chatTick(){if(!botsWarmOk()||!BOTS.names.length)return;try{chatPump()}catch(e){console.error(e)}const now=Date.now();
 if(chatOpen&&$('#chList'))chatRefresh();else{chatOpen=false;const L=chatVisible(now).filter(m=>m.t>CHAT.seenT&&!m.me);CHAT.unread=L.filter(m=>!m.sys).length;
  const at=L.filter(chMine);if(at.length>CHAT.mention){const m=at[at.length-1];toast(T('{n} menyebutmu di obrolan',{n:chName(m)}))}CHAT.mention=at.length}
 const st=$('#hchat');if(st)st.innerHTML=chatStripHTML();if(now-(CHAT.coAt||0)>6e4){CHAT.coAt=now;try{chatCallouts(now)}catch(e){}}}
setTimeout(()=>setInterval(chatTick,1500),3500);
Object.assign(ACT,{chat:()=>openChat(),chatQuick:q=>{const i=$('#chIn');if(i){i.value=q;i.focus()}},chatBot:i=>{chatOpen=false;openBot(+i,'chat')}});
