/* ================= PERINGKAT (CP & Level) + PROFIL PEMAIN =================
   Data dari systems/bots.js. Diperbarui realtime tiap 5 detik selama terbuka.
   ======================================================================== */
ICON.rank=pxIcon(K=>{K.rect(4,2,8,1,'#c98a1a');K.rect(3,3,10,5,'#ffc83d');K.rect(4,8,8,1,'#e0a020');K.rect(5,9,6,1,'#c98a1a');K.rect(7,10,2,2,'#c98a1a');K.rect(5,12,6,2,'#a8650e');K.rect(4,14,8,1,'#7a4a10');
 K.rect(1,3,2,1,'#ffc83d');K.rect(1,4,1,2,'#ffc83d');K.rect(2,6,2,1,'#ffc83d');K.rect(13,3,2,1,'#ffc83d');K.rect(14,4,1,2,'#ffc83d');K.rect(12,6,2,1,'#ffc83d');K.rect(5,4,2,3,'#fff6c0');K.P(8,5,'#e8483b')});
let rankTab='cp',rankTimer=null,rankBot=null;
function agoMs(ms){const m=Math.floor(ms/60e3);if(m<1)return T('baru saja');if(m<60)return T('{n} menit lalu',{n:m});const h=Math.floor(m/60);if(h<24)return T('{n} jam lalu',{n:h});return T('{n} hari lalu',{n:Math.floor(h/24)})}
/* naik/turun peringkat: dibandingkan dengan potret peringkat ≥1 jam lalu; peringkatmu kemarin disimpan per hari WIB */
const RS_KEY='aster_ranksnap';let RANK_PREV=null;
function rankMaps(L){const m={};for(const tab of['cp','lv']){const A=L.slice().sort(tab==='cp'?(a,b)=>b.cp-a.cp||b.lv-a.lv:(a,b)=>b.lv-a.lv||b.cp-a.cp);m[tab]={};A.forEach((e,k)=>m[tab][e.me?'me':e.i]=k+1)}return m}
function rankSnapUpdate(){const L=botsList(),now=Date.now(),cur=rankMaps(L);let snap=null;try{snap=JSON.parse(localStorage.getItem(RS_KEY)||'null')}catch(e){}
 RANK_PREV=snap;if(!snap||now-snap.t>36e5){try{localStorage.setItem(RS_KEY,JSON.stringify({t:now,cp:cur.cp,lv:cur.lv}))}catch(e){}}
 const d=wibDay(now);S.rankDay=S.rankDay||{};if(!S.rankDay.cur||S.rankDay.cur.d!==d){if(S.rankDay.cur)S.rankDay.prev=S.rankDay.cur;S.rankDay.cur={d,cp:cur.cp.me,lv:cur.lv.me};save()}else{S.rankDay.cur.cp=cur.cp.me;S.rankDay.cur.lv=cur.lv.me}}
function rankDelta(e,k){if(!e.me&&e.isNew)return`<span class="rkd new">${T('BARU')}</span>`;if(!e.me&&e.back)return`<span class="rkd back">${T('KEMBALI')}</span>`;
 const P=rankTab!=='ar'&&RANK_PREV&&RANK_PREV[rankTab];if(!P)return'';const was=P[e.me?'me':e.i];if(!was)return'';const d=was-(k+1);return d>0?`<span class="rkd up">▲${d}</span>`:d<0?`<span class="rkd dn">▼${-d}</span>`:`<span class="rkd eq">–</span>`}
function rankSorted(){if(rankTab==='rec')return botsList().sort((a,b)=>b.cp-a.cp||b.lv-a.lv);if(rankTab==='ar'){arCheck();return arBoard().slice().concat([arMe()]).sort((a,b)=>b.pts-a.pts||b.cp-a.cp)}const L=botsList();return L.sort(rankTab==='cp'?(a,b)=>b.cp-a.cp||b.lv-a.lv:(a,b)=>b.lv-a.lv||b.cp-a.cp)}
function rankRow(e,k){const md=k<3?` m${k+1}`:'';return`<button class="rkrow${e.me?' mine':''}" ${e.me?'data-act="closeModal"':e.h?`data-act="profView" data-arg="${e.h}"`:`data-act="botView" data-arg="${e.i}"`}>
 <span class="rkn${md}">${k+1}</span><span class="rkav">${e.top?`<img class="px" src="${portrait(e.top)}">`:''}${e.online?'<i class="on"></i>':''}</span>
 <span class="rknm"><b>${e.vip?`<i class="vip v${Math.min(7,e.vip)}">VIP${e.vip}</i>`:''}${esc(e.name)}${e.me?` <em>${T('Kamu')}</em>`:''}${!e.me&&typeof e.i==='number'&&typeof rvIs==='function'&&rvIs(e.i)?`<span class="rkd rv">⚔ ${T('RIVAL')}</span>`:''}${rankDelta(e,k)}</b><small>${e.me&&S.rankDay&&S.rankDay.prev&&S.rankDay.prev[rankTab]?T('Kemarin #{n}',{n:S.rankDay.prev[rankTab]}):e.online?T('Online'):T('Aktif {t}',{t:agoMs(Date.now()-e.last)})}</small></span>
 <span class="rkv">${rankTab==='ar'?`<b>${lgIc(e.pts,14)} ${fmt(e.pts)}</b><small>CP ${fmt(e.cp)}</small>`:`<b>${rankTab==='cp'?fmt(e.cp):'Lv '+e.lv}</b><small>${rankTab==='cp'?'Lv '+e.lv:'CP '+fmt(e.cp)}</small>`}</span></button>`}
function rankListHTML(){if(rankTab==='rec'&&typeof annRecPanelHTML==='function')return annRecPanelHTML();const L=rankSorted(),me=L.findIndex(e=>e.me),n=L.length-1,on=L.filter(e=>e.online&&!e.me).length;
 if(!n)return`<p class="sub" style="text-align:center;padding:30px 0">${BOTS.ready?T('Memanggil para petualang...'):T('Memuat pemain...')}</p>`;
 return`<div class="rkinfo"><span>${typeof NET!=='undefined'&&NET.srvName?`<em class="rksrv">S${netSrv()} · ${esc(NET.srvName)}</em> `:''}<b>${n}</b> ${rankTab==='ar'?T('peserta'):T('pemain')}</span><span><i class="on"></i><b>${on}</b> ${T('online')}</span></div>
 ${rankTab!=='ar'&&typeof rvBarHTML==='function'?rvBarHTML():''}<div class="rklist" id="rkScroll">${L.slice(0,100).map(rankRow).join('')}</div>${me>=100?`<div class="rkme">${rankRow(L[me],me)}</div>`:''}`}
function openRank(){botsInit();botsEnsure();botsEnsureBios();rankBot=null;netPlayers();
 if(!botsWarmOk()){modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Peringkat')}</h3><p class="sub" style="text-align:center;padding:30px 0">${T('Memuat peringkat...')}</p>`);botsWarm(()=>{if($('#modal').classList.contains('on')&&!rankBot)openRank()});return}if(!RANK_PREV||!openRank.done){rankSnapUpdate();openRank.done=1}
 modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Peringkat')}</h3>
 <div class="mtabs"><button class="btn ${rankTab==='cp'?'':'blue'}" data-act="rankTab" data-arg="cp">${T('CP Tim')}</button><button class="btn ${rankTab==='lv'?'':'blue'}" data-act="rankTab" data-arg="lv">${T('Level')}</button><button class="btn ${rankTab==='ar'?'':'blue'}" data-act="rankTab" data-arg="ar">${T('Arena')}</button><button class="btn ${rankTab==='rec'?'':'blue'}" data-act="rankTab" data-arg="rec">${T('Rekor')}</button></div>
 <div id="rkBody">${rankListHTML()}</div>`);rankStartTimer()}
function rankRefresh(){const b=$('#rkBody');if(!b)return;const sc=$('#rkScroll'),top=sc?sc.scrollTop:0;b.innerHTML=rankListHTML();const sc2=$('#rkScroll');if(sc2)sc2.scrollTop=top}
function rankStartTimer(){if(rankTimer)return;
 rankTimer=setInterval(()=>{const open=$('#modal').classList.contains('on')&&($('#rkBody')||$('#botBody'));if(!open){clearInterval(rankTimer);rankTimer=null;return}
  botsEnsure();netPlayers()
  if($('#rkBody'))rankRefresh();else if($('#botBody')&&rankBot!=null)$('#botBody').innerHTML=botBodyHTML(rankBot)},5000)}
BOTS.onChange=()=>{if($('#rkBody'))rankRefresh()};

/* ---- profil pemain bot ---- */
function botHeroCard(s,id,big){const h=s.heroes[id],w=h.wpn&&WD[h.wpn],o=w&&s.weapons[h.wpn],hs=h.asc||HD[id].r;
 return`<div class="bhc r${hs}${big?' big':''}">${id===s.fav?`<span class="fav" title="${T('Hero favorit')}">♥</span>`:''}<img class="px hp" src="${portrait(id)}"><img class="px el" src="${ICON.el[HD[id].el]}">
 <span class="st">${stars(hs)}</span>${h.lb?`<span class="lb">+${h.lb}</span>`:''}<b>${HD[id].name}</b><small>Lv ${h.lv}</small>
 ${big?`<div class="eqr">${w?`<span title="${w.name}"><img class="px" src="${weaponIcon(h.wpn).url}"><i>${o.lv}</i></span>`:''}${h.ar?`<span><img class="px" src="${gearIcon(h.ar).url}"><i>+${s.gear[h.ar].lv}</i></span>`:''}${h.ac?`<span><img class="px" src="${gearIcon(h.ac).url}"><i>+${s.gear[h.ac].lv}</i></span>`:''}</div>`:''}</div>`}
function botBodyHTML(i){const s=botState(i),p=botPresence(i),b=botBase(i),now=Date.now();
 const ids=Object.keys(s.heroes).sort((x,y)=>(y===s.fav)-(x===s.fav)||HD[y].r-HD[x].r||s.heroes[y].lv-s.heroes[x].lv);const L=rankSorted(),rk=L.findIndex(e=>e.i===i)+1;
 const bio=botBio(i,s,rk,now),st=s.stats,LUCK={hoki:T('Hoki'),normal:T('Normal'),sial:T('Apes')},old=botOldName(i,now);
 return`<div class="bprof"><div class="bpav">${(s.av||s.fav)?`<img class="px" src="${portrait(s.av||s.fav)}">`:''}${p.online?'<i class="on"></i>':''}</div>
  <div class="bpinf"><b>${st.vip?`<i class="vip v${Math.min(7,st.vip)}">VIP${st.vip}</i>`:''}${esc(botName(i,now))}</b>${botUid(i)?`<small class="bold">UID ${botUid(i)}</small>`:''}${old?`<small class="bold">${T('Sebelumnya: {n}',{n:esc(old)})}</small>`:''}<span>${p.online?`<em class="ok">${T('Online')}</em>${botWhere(i,now)}`:T('Aktif {t}',{t:agoMs(now-p.last)})}${b.back&&now>=b.segs[2][0]?` · <em class="ok">${T('Kembali bermain!')}</em>`:''}</span><span>${T('Bergabung {t}',{t:agoMs(now-b.join)})}</span></div></div>
 ${st.card?`<div class="bbadges"><span class="bb card">${T('Kartu Bulanan')}</span></div>`:''}
 ${typeof rvProfHTML==='function'?rvProfHTML(i):''}${bio?`<div class="bbio">“${esc(bio)}”</div>`:''}
 <div class="stats"><div><span>${T('Level')}</span><b>${s.lv}</b></div><div><span>CP</span><b>${fmt(s.cp)}</b></div><div><span>${T('Peringkat')}</span><b>#${rk}</b></div><div><span>${T('Tahap')}</span><b>${s.stage}</b></div></div>
 <div class="bstat"><div><b>${fmt(st.sum)}</b><span>${T('Total summon')}</span></div><div><b>${st.s3}${st.lim3?` <i>(${st.lim3} ${T('terbatas')})</i>`:''}</b><span>${T('★3 didapat')}</span></div><div><b>${st.days}</b><span>${T('Hari login')}</span></div><div><b>${st.hours<10?st.hours.toFixed(1):Math.round(st.hours)} ${T('jam')}</b><span>${T('Waktu main')}</span></div><div class="lk ${st.luck}"><b>${LUCK[st.luck]}</b><span>${T('Gacha')}</span></div></div>
 <div class="sec">${T('Tim Utama')}</div><div class="bteam">${s.team.map(id=>botHeroCard(s,id,true)).join('')}</div>
 <div class="sec">${T('Koleksi Hero')} · ${ids.length}/${HEROES.length}</div><div class="broster">${ids.map(id=>botHeroCard(s,id,false)).join('')}</div>
 <p class="sub" style="text-align:center;margin-top:6px">${T('Senjata dimiliki: {n}',{n:Object.keys(s.weapons).length})} · ${T('Perlengkapan: {n}',{n:Object.keys(s.gear).length})}</p>`}
function openBot(i,back){i=+i;if(!botIn(i)||botHidden(i))return;rankBot=i;botsEnsureBios();if(typeof annFreshBot==='function')annFreshBot(i);const uid=botUid(i);
 modal(`<button class="btn red mclose" data-act="${back||'rank'}">‹</button><h3>${T('Profil Pemain')}</h3><div id="botBody">${botBodyHTML(i)}</div>${uid?profActions(uid):''}`);rankStartTimer();
 if(uid&&loggedIn()&&Date.now()-NET.frAt>15e3)netFriends().then(()=>{const pa=$('#modal .pfact');if(pa&&rankBot===i)pa.outerHTML=profActions(uid)})}

Object.assign(ACT,{rank:()=>openRank(),rankTab:a=>{rankTab=a;if(a==='rec'&&typeof ANN!=='undefined'){ANN.stWant=1;if(typeof wcFetch==='function')wcFetch().then(()=>{if(rankTab==='rec')rankRefresh()})}openRank()},botView:i=>openBot(i)});
// mulai dunia bot sesaat setelah game siap (nama dibuat Claude bila tersedia)
setTimeout(()=>{botsInit();botsWarm();setInterval(()=>{botsEnsure();botsEnsureRenames()},30e3);setInterval(()=>botsWarm(),120e3)},2500);

// awal ulang dunia bot: potret peringkat lama tidak berlaku lagi
function rankReset(){RANK_PREV=null}

// status kasar bot yang sedang online (seperti status di game asli): Petualangan / Dungeon / Arena / Summon
function botWhere(i,now){try{const a=typeof botActivity==='function'&&botActivity(i,now);const w=a&&{push:'Petualangan',stuck:'Petualangan',dg:'Dungeon',arena:'Arena',gacha:'Summon',wb:'Bos Dunia',wbpre:'Bos Dunia'}[a.k];return w?' · '+T('di {w}',{w:T(w)}):''}catch(e){return''}}
