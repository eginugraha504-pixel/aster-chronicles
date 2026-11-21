/* =====================================================================
   SOSIAL — Teman, Permintaan, Cari pemain, Pesan 1:1, profil pemain asli
   Data dari server lewat systems/net.js. Bot juga punya akun (UID + username) dan bisa berteman:
   bot menjawab permintaanmu saat ia online, dan kadang mengajakmu berteman lebih dulu.
   Pesan 1:1 hanya untuk sesama teman. Teman bot membaca & membalas saat ia online (dmBotTick → /api/dm/bot), sesuai wataknya.
   ===================================================================== */
ICON.friend=pxIcon(K=>{K.rect(3,3,4,4,'#ffd9b0');K.rect(2,8,6,5,'#4fa3ff');K.rect(9,4,4,4,'#ffd9b0');K.rect(8,9,6,5,'#ff8a5c');K.rect(3,2,4,2,'#5a3a22');K.rect(9,3,4,2,'#2a2a44');K.rect(12,12,3,3,'#3ad06a');K.rect(13,11,1,5,'#fff');K.rect(11,13,5,1,'#fff')});
let socTab='fr',dmOpenWith=null,dmTimer=null,dmLast=0,dmSeen=0,dmList=[];
const needAcct=()=>modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Butuh Akun')}</h3><p style="text-align:center;font-size:13px">${T('Fitur teman, pesan, dan obrolan butuh akun. Daftarkan akun — progres tamu kamu ikut tersimpan.')}</p><div class="mrow"><button class="btn green" data-act="accLink">${T('Daftarkan Akun')}</button></div>`);
const onDot=p=>p.bot!=null?botPresence(p.bot).online:p.on;
const lastSeen=p=>p.bot!=null?botPresence(p.bot).last:p.last;
function socAv(p){const top=p.bot!=null&&botIn(p.bot)?(botState(p.bot).av||botState(p.bot).fav||botState(p.bot).team[0]):p.top;return`<span class="rkav">${top&&HD[top]?`<img class="px" src="${portrait(top)}">`:''}${onDot(p)?'<i class="on"></i>':''}</span>`}
function socName(p){const v=p.bot!=null&&botIn(p.bot)?botState(p.bot).stats.vip:p.vip;return`${v?`<i class="vip v${Math.min(7,v)}">VIP${v}</i>`:''}${esc(p.bot!=null?botName(p.bot):p.u)}`}
function socSub(p){const s=p.bot!=null&&botIn(p.bot)?botState(p.bot):p;return`Lv ${s.lv} · CP ${fmt(s.cp)} · ${onDot(p)?`<em class="ok">${T('Online')}</em>`:T('Aktif {t}',{t:agoMs(Date.now()-lastSeen(p))})}`}
function socRow(p,btns){return`<div class="frrow"><button class="frmain" data-act="profView" data-arg="${p.uid}">${socAv(p)}<span class="rknm"><b>${socName(p)}</b><small>${socSub(p)}</small></span></button><span class="frbt">${btns}</span></div>`}
function socBody(){const F=NET.friends;
 if(socTab==='fr'){const L=F.friends.slice().sort((a,b)=>onDot(b)-onDot(a)||lastSeen(b)-lastSeen(a));
  return L.length?`<div class="frlist">${L.map(p=>socRow(p,`<button class="btn sm" data-act="dmOpen" data-arg="${p.uid}">💬</button>`)).join('')}</div>`:`<p class="sub frempty">${T('Belum punya teman. Cari pemain lewat tab Cari atau dari Peringkat.')}</p>`}
 if(socTab==='rq'){return(F.inc.length?`<div class="sec">${T('Permintaan masuk')}</div><div class="frlist">${F.inc.map(p=>socRow(p,`<button class="btn sm green" data-act="frResp" data-arg="${p.uid}:1">✓</button><button class="btn sm red" data-act="frResp" data-arg="${p.uid}:0">✕</button>`)).join('')}</div>`:'')+
  (F.out.length?`<div class="sec">${T('Menunggu jawaban')}</div><div class="frlist">${F.out.map(p=>socRow(p,`<button class="btn sm gray" data-act="frDel" data-arg="${p.uid}">${T('Batal')}</button>`)).join('')}</div>`:'')||`<p class="sub frempty">${T('Tidak ada permintaan pertemanan.')}</p>`}
 if(socTab==='dm')return`<div id="dmThreads"><p class="sub frempty">${T('Memuat pesan...')}</p></div>`;
 return`<form class="frfind" id="frFind"><input id="frQ" maxlength="14" autocomplete="off" placeholder="${T('Username atau UID')}"><button class="btn" type="submit">${T('Cari')}</button></form><div id="frRes"></div>`}
function openSocial(tab){if(!loggedIn())return needAcct();if(tab)socTab=tab;
 const F=NET.friends,dmN=NET.dm;
 // modal Teman sudah terbuka (ganti tab / data baru masuk) -> isi diganti di tempat, tanpa animasi & suara buka lagi
 const html=(`<button class="btn red mclose" data-act="closeModal">✕</button><h3><img class="ix" src="${ICON.friend}" style="width:24px;height:24px"> ${T('Teman')}</h3>
 <div class="frme">${T('UID kamu')}: <b>${NET.acct.uid}</b> · ${esc(NET.acct.u)} <button class="frcopy" data-act="frCopy">${T('Salin')}</button></div>
 <div class="mtabs frtabs">${[['fr',T('Teman')+` ${F.friends.length}/100`],['dm',T('Pesan')+(dmN?` <i class="dot n">${dmN}</i>`:'')],['rq',T('Permintaan')+(F.inc.length?` <i class="dot n">${F.inc.length}</i>`:'')],['cari',T('Cari')]].map(([k,n])=>`<button class="btn ${socTab===k?'':'blue'}" data-act="socTab" data-arg="${k}">${n}</button>`).join('')}</div>
 <div id="socBody">${socBody()}</div>`);
 const box=$('#socBody')&&$('#modal').classList.contains('on')?$('#modal .mbox'):null;
 if(box){if(box.dataset.soc!==html){box.innerHTML=html;box.dataset.soc=html}}else{modal(html);$('#modal .mbox').classList.add('socbox');$('#modal .mbox').dataset.soc=html}
 if(socTab==='dm')dmThreads();
 const f=$('#frFind');if(f)f.onsubmit=async e=>{e.preventDefault();const q=($('#frQ').value||'').trim();if(q.length<2)return;const r=$('#frRes');r.innerHTML=`<p class="sub frempty">${T('Mencari...')}</p>`;
  const o=await api('/api/find?q='+encodeURIComponent(q)+'&srv='+netSrv());netCards(o.list);if(!$('#frRes'))return;const L=(o.list||[]).filter(p=>p.uid!==NET.acct.uid&&(p.bot==null||(botIn(p.bot)&&!botHidden(p.bot))));
  r.innerHTML=L.length?`<div class="frlist">${L.map(p=>socRow(p,frBtn(p.uid))).join('')}</div>`:`<p class="sub frempty">${o.ok?T('Pemain tidak ditemukan.'):netErr(o.e)}</p>`}}
function frBtn(uid){const st=frState(uid);return st==='ok'?`<button class="btn sm" data-act="dmOpen" data-arg="${uid}">💬</button>`:st==='out'?`<button class="btn sm gray" disabled>${T('Diminta')}</button>`:st==='inc'?`<button class="btn sm green" data-act="frResp" data-arg="${uid}:1">${T('Terima')}</button>`:`<button class="btn sm green" data-act="frAdd" data-arg="${uid}">+ ${T('Teman')}</button>`}
async function dmThreads(){const o=await api('/api/dm/threads',{tok:netTok()}),box=$('#dmThreads');if(!box)return;const L=netCards(o.list||[]);
 box.innerHTML=L.length?`<div class="frlist">${L.map(p=>`<button class="frrow dmth" data-act="dmOpen" data-arg="${p.uid}">${socAv(p)}<span class="rknm"><b>${socName(p)}</b><small>${p.msg.me?T('Kamu')+': ':''}${esc(p.msg.txt)}</small></span><span class="dmt"><small>${agoMs(Date.now()-p.msg.ts)}</small>${p.unread?`<i class="dot n">${p.unread}</i>`:''}</span></button>`).join('')}</div>`:`<p class="sub frempty">${T('Belum ada pesan. Kirim pesan ke teman dari tab Teman.')}</p>`}

/* ---------------- pesan 1:1 ---------------- */
function dmPeer(uid){const all=NET.friends.friends.concat(NET.friends.inc,NET.friends.out);return all.find(p=>p.uid===uid)||{uid,u:'?',bot:null}}
function dmRowsHTML(){if(!dmList.length)return`<p class="sub frempty">${T('Mulai percakapan!')}</p>`;let out='',day='';
 for(const m of dmList){const d=new Date(m.ts+BOT_CFG.TZ*36e5).toISOString().slice(0,10);if(d!==day){day=d;out+=`<div class="dmday">${d===new Date(Date.now()+BOT_CFG.TZ*36e5).toISOString().slice(0,10)?T('Hari ini'):d.split('-').reverse().join('/')}</div>`}
  out+=`<div class="dmm${m.me?' mine':''}"><p>${esc(m.txt)}</p><small>${chTime(m.ts)}${m.me?(m.id<=dmSeen?' ✓✓':' ✓'):''}</small></div>`}return out}
async function dmPoll(force){if(!dmOpenWith)return;const o=await api('/api/dm/get',{tok:netTok(),uid:dmOpenWith,after:force?0:dmLast});if(!o.ok||!dmOpenWith)return;
 const box=$('#dmList');if(!box){dmClose();return}const near=box.scrollHeight-box.scrollTop-box.clientHeight<80;let ch=o.seen!==dmSeen;dmSeen=o.seen;
 if(force)dmList=[];if(o.list.length){dmList=dmList.concat(o.list.filter(m=>!dmList.some(x=>x.id===m.id))).sort((a,b)=>a.ts-b.ts||a.id-b.id);dmLast=Math.max(dmLast,...dmList.map(m=>m.ts));ch=true}
 const ty=$('#dmTyping');if(ty)ty.classList.toggle('on',!!o.typing);
 if(ch||force){box.innerHTML=dmRowsHTML();if(force||near)box.scrollTop=box.scrollHeight}
 if(o.list.some(m=>!m.me)){NET.dm=Math.max(0,NET.dm-o.list.filter(m=>!m.me).length);refreshBadges()}}
function dmClose(){dmOpenWith=null;clearInterval(dmTimer);dmTimer=null}
function openDM(uid){if(!loggedIn())return needAcct();const p=dmPeer(uid);dmOpenWith=uid;dmLast=0;dmSeen=0;dmList=[];if(p.bot!=null)dmBotKick();
 const bot=p.bot!=null;
 modal(`<button class="btn red mclose" data-act="dmBack">‹</button><h3 class="dmh"><button data-act="profView" data-arg="${uid}">${socAv(p)}<span><b>${socName(p)}</b><small>${onDot(p)?T('Online'):T('Aktif {t}',{t:agoMs(Date.now()-lastSeen(p))})}<em id="dmTyping"> · ${T('sedang mengetik...')}</em></small></span></button></h3>
 <div class="dmlist" id="dmList"><p class="sub frempty">${T('Memuat pesan...')}</p></div>
 ${isFriend(uid)?`<form class="chin" id="dmForm"><input id="dmIn" maxlength="300" autocomplete="off" placeholder="${T('Tulis pesan...')}"><button class="btn" type="submit">${T('Kirim')}</button></form>`:`<p class="sub frempty">${T('Kalian harus berteman untuk saling mengirim pesan.')}</p>`}`);
 $('#modal .mbox').classList.add('socbox','dmbox');
 const f=$('#dmForm');if(f)f.onsubmit=async e=>{e.preventDefault();const i=$('#dmIn'),v=(i.value||'').trim();if(!v)return;i.value='';sfx('tap');
  const o=await api('/api/dm/send',{tok:netTok(),uid,txt:v});if(!o.ok){i.value=v;toast(o.e==='fast'?T('Pelan-pelan, tunggu sebentar.'):o.e==='notfriend'?T('Kalian belum berteman.'):netErr(o.e));return}dmPoll();if(bot)dmBotKick()};
 dmPoll(true);clearInterval(dmTimer);dmTimer=setInterval(()=>{if(!$('#dmList')){dmClose();return}dmPoll()},4000)}

/* ---------------- teman bot membaca & membalas DM ----------------
   Server menyimpan pesan; game (yang tahu jadwal sesi bot) memutuskan KAPAN si bot membaca (saat ia online: 20 dtk–4 menit setelah
   sempat melihat; kalau sedang offline, saat sesi berikutnya — bisa sudah lewat bila kamu tidak membuka game) dan seberapa suka ia membalas.
   Bot yang sudah berhenti main tidak pernah membaca. Sapaan pertama setelah berteman: jarang, sekali, saat bot online. */
const DMB={busy:false,at:0,kick:false,cool:{}};
// watak membalas DM (aliran acak sendiri, tetap per bot): kebanyakan membalas, sebagian cukup membaca
function dmBotP(i){const P=wcPersona(i);let p=.35+bRng(bHash(i,7811))()*.55;if(/cuek/.test(P.sifat))p*=.55;else if(/suka bantu|kocak|kompetitif|sering cerita|pemain baru/.test(P.sifat))p=Math.min(.95,p+.15);return p}
// kapan bot pertama kali "melihat" pesan yang masuk pada t0 (null = belum online sejak itu)
function dmBotSeeAt(i,t0,now){const b=botBase(i);if(b.endT<t0)return null;
 for(let d=wibDay(t0);d<=wibDay(now)&&d<=wibDay(t0)+4;d++)for(const[s0,s1]of botSessions(b,d)){if(s1<t0)continue;const st=Math.max(s0,t0);if(st>now)return null;
  const at=st+(20+bRng(bHash(i,(st/6e4)|0))()*220)*1e3;return Math.min(at,Math.max(st+5e3,s1-2e4))}
 return null}
function dmBotRel(i){const L=[];if(typeof rvIs==='function'&&rvIs(i))L.push('CP kalian saling kejar di peringkat (saingan)');
 const A=(S.arena&&S.arena.log||[]).filter(e=>e.i===i&&Date.now()-e.t<3*BDAY);if(A.length)L.push(`baru-baru ini bertemu di Arena (${A.map(e=>e.k==='atk'?(e.win?'dia kalah diserangnya':'dia menang diserangnya'):(e.held?'serangannya ke tim bertahan lawan bicara gagal':'serangannya ke tim bertahan lawan bicara berhasil')).slice(0,2).join(', ')})`);
 return['berteman di game'].concat(L).join('; ')}
function dmBotBody(i,uid,kind,at){const D=wcDesc(i,Date.now());
 return{tok:netTok(),uid,kind,at:Math.round(at),p:dmBotP(i),rel:dmBotRel(i),cand:{pub:D.pub,priv:D.priv,style:wcStyle(i),lower:wcPersona(i).lower},player:{name:NET.acct.u,pub:wcMePub()}}}
function dmBotKick(){DMB.kick=true;setTimeout(dmBotTick,2500)}
async function dmBotTick(){if(!loggedIn()||(typeof watchMode==='function'&&watchMode())||DMB.busy||!botsWarmOk()||!BOTS.uids||document.hidden)return;const now=Date.now();if(!DMB.kick&&now-DMB.at<45e3)return;
 DMB.at=now;DMB.kick=false;DMB.busy=true;
 try{const o=await api('/api/dm/pending',{tok:netTok()});
  for(const x of(o.ok&&o.list)||[]){const i=botIdxOf(x.uid);if(i<0||!botIn(i,now)||botHidden(i)||(DMB.cool[x.uid]||0)>now)continue;
   const at=dmBotSeeAt(i,x.t0,now);if(at==null)continue;DMB.cool[x.uid]=now+6e4;
   const r=await api('/api/dm/bot',dmBotBody(i,x.uid,'reply',at));if(r&&r.ok&&dmOpenWith===x.uid)dmPoll(true)}
  // sapaan pertama setelah berteman (diputuskan saat berteman, dikirim saat si bot online)
  const H=S.dmHi||[];for(const h of H.slice()){const i=botIdxOf(h.uid);if(i<0||!botIn(i,now)||!isFriend(h.uid)||now-h.t>3*BDAY){S.dmHi=H.filter(x=>x!==h);continue}
   const at=dmBotSeeAt(i,h.t,now);if(at==null)continue;S.dmHi=(S.dmHi||[]).filter(x=>x!==h);save();await api('/api/dm/bot',dmBotBody(i,h.uid,'hello',at+3e4))}
 }catch(e){}finally{DMB.busy=false}}
// dipanggil saat berteman dengan bot: sebagian kecil menyapa duluan (yang mengajak berteman lebih sering)
function dmBotFriended(uid,i,byBot){const P=wcPersona(i),r=bRng(bHash(i,7833+(+NET.acct.uid%9973)))();let p=byBot?.42:.22;if(/cuek/.test(P.sifat))p*=.4;
 if(r<p){S.dmHi=(S.dmHi||[]).filter(x=>x.uid!==uid).concat([{uid,t:Date.now()}]).slice(-10);save()}}
setInterval(dmBotTick,15e3);

/* ---------------- profil pemain asli ---------------- */
function profBodyHTML(o){const s=o.prof||{},heroes=s.heroes||{},ids=Object.keys(heroes).filter(id=>HD[id]);
 const P={heroes,weapons:s.weapons||{},gear:s.gear||{},fav:s.top};ids.sort((x,y)=>(y===s.top)-(x===s.top)||(heroes[y].asc||HD[y].r)-(heroes[x].asc||HD[x].r)||heroes[y].lv-heroes[x].lv);
 const L=rankSorted(),rk=L.findIndex(e=>e.h===o.uid||(e.me&&loggedIn()&&o.uid===NET.acct.uid))+1;
 return`<div class="bprof"><div class="bpav">${s.top&&HD[s.top]?`<img class="px" src="${portrait(s.top)}">`:''}${o.on?'<i class="on"></i>':''}</div>
  <div class="bpinf"><b>${o.vip?`<i class="vip v${Math.min(7,o.vip)}">VIP${o.vip}</i>`:''}${esc(o.u)}</b><small class="bold">UID ${o.uid}</small><span>${o.on?`<em class="ok">${T('Online')}</em>`:T('Aktif {t}',{t:agoMs(Date.now()-o.last)})}</span></div></div>
 ${s.bio?`<div class="bbio">“${esc(s.bio)}”</div>`:''}
 <div class="stats"><div><span>${T('Level')}</span><b>${o.lv}</b></div><div><span>CP</span><b>${fmt(o.cp)}</b></div><div><span>${T('Peringkat')}</span><b>${rk?'#'+rk:'—'}</b></div><div><span>${T('Tahap')}</span><b>${esc(s.stage||'-')}</b></div></div>
 <div class="bstat"><div><b>${s.days||1}</b><span>${T('Hari login')}</span></div><div><b>${s.nh||ids.length}</b><span>${T('Hero')}</span></div><div><b>${s.nw||0}</b><span>${T('Senjata')}</span></div><div><b>${fmt(s.ar||0)}</b><span>${T('Poin Arena')}</span></div></div>
 ${(s.team||[]).filter(id=>heroes[id]).length?`<div class="sec">${T('Tim Utama')}</div><div class="bteam">${s.team.filter(id=>heroes[id]&&HD[id]).map(id=>botHeroCard(P,id,true)).join('')}</div>`:''}
 ${ids.length?`<div class="sec">${T('Koleksi Hero')} · ${ids.length}/${HEROES.length}</div><div class="broster">${ids.map(id=>botHeroCard(P,id,false)).join('')}</div>`:''}`}
function profActions(uid){if(!loggedIn()||uid===NET.acct.uid)return'';const st=frState(uid);
 return`<div class="mrow pfact">${st==='ok'?`<button class="btn" data-act="dmOpen" data-arg="${uid}">💬 ${T('Kirim Pesan')}</button><button class="btn gray" data-act="frDelAsk" data-arg="${uid}">${T('Hapus Teman')}</button>`
  :st==='out'?`<button class="btn gray" disabled>${T('Permintaan terkirim')}</button><button class="btn red" data-act="frDel" data-arg="${uid}">${T('Batal')}</button>`
  :st==='inc'?`<button class="btn green" data-act="frResp" data-arg="${uid}:1">${T('Terima Pertemanan')}</button><button class="btn red" data-act="frResp" data-arg="${uid}:0">${T('Tolak')}</button>`
  :`<button class="btn green" data-act="frAdd" data-arg="${uid}">+ ${T('Tambah Teman')}</button>`}</div>`}
let profBack=null;
async function openProfile(uid,back){profBack=back||null;const bi=botIdxOf(uid);if(bi>=0){openBot(bi,back||'closeModal');return}
 if(loggedIn()&&uid===NET.acct.uid){closeModal();return}
 modal(`<button class="btn red mclose" data-act="${back||'closeModal'}">‹</button><h3>${T('Profil Pemain')}</h3><div id="pfBody"><p class="sub frempty">${T('Memuat profil...')}</p></div>`);
 const o=await api('/api/prof?uid='+uid);const b=$('#pfBody');if(!b)return;if(!o.ok){b.innerHTML=`<p class="sub frempty">${T('Pemain tidak ditemukan.')}</p>`;return}
 if(o.bot!=null){const j=botJ(o.bw,o.bot);if(j!=null&&botIn(j)){openBot(j,back||'closeModal');return}b.innerHTML=`<p class="sub frempty">${T('Pemain ini ada di server lain.')}</p>`;return}
 b.innerHTML=profBodyHTML(o)+profActions(uid)}
async function frAct(path,uid,extra){if(!loggedIn())return needAcct();const o=await api('/api/fr/'+path,{tok:netTok(),uid,...extra});if(!o.ok){toast(o.e==='full'?T('Daftar teman sudah penuh (100).'):netErr(o.e));return o}await netFriends();refreshBadges();return o}
Object.assign(ACT,{
 friends:()=>{const t=NET.fr?'rq':NET.dm?'dm':'fr';openSocial(t);netFriends().then(()=>{if($('#socBody')&&!$('#frRes')&&socTab!=='dm')openSocial()})},
 socTab:k=>{socTab=k;openSocial()},
 frCopy:()=>{try{navigator.clipboard.writeText(NET.acct.uid)}catch(e){}toast(T('UID disalin'))},
 profView:uid=>{const back=$('#chList')?'chat':$('#socBody')?'friends':null;openProfile(String(uid),back)},
 frAdd:async uid=>{const o=await frAct('add',uid);if(!o||!o.ok)return;sfx('claim');toast(o.st==='ok'?T('Kalian sekarang berteman!'):T('Permintaan pertemanan dikirim'));const pa=$('#modal .pfact');if(pa)pa.outerHTML=profActions(uid);else if($('#frRes'))$('#frFind').requestSubmit();},
 frResp:async a=>{const[uid,ok]=a.split(':');const o=await frAct('resp',uid,{ok:ok==='1'});if(!o||!o.ok)return;if(ok==='1'){const bi=botIdxOf(uid);if(bi>=0)dmBotFriended(uid,bi,true)}sfx(ok==='1'?'claim':'close');toast(ok==='1'?T('Kalian sekarang berteman!'):T('Permintaan ditolak'));const pa=$('#modal .pfact');if(pa)pa.outerHTML=profActions(uid);else openSocial()},
 frDel:async uid=>{await frAct('del',uid);const pa=$('#modal .pfact');if(pa)pa.outerHTML=profActions(uid);else openSocial()},
 frDelAsk:uid=>{const p=dmPeer(uid);confirmBox(T('Hapus {n} dari daftar teman?',{n:esc(p.bot!=null?botName(p.bot):p.u)}),async()=>{await frAct('del',uid);openSocial('fr')},T('Hapus'))},
 dmOpen:uid=>openDM(uid),
 dmBack:()=>{dmClose();openSocial('dm')},
});
