/* =====================================================================
   NET — akun & dunia bersama lewat server (bank-worker/src/game.js, alamat = TOPUP_CFG.api)
   ---------------------------------------------------------------------
   • Akun: username + password. Sesi (token) di localStorage 'aster_acct' — TIDAK ikut data simpanan.
   • Simpanan cloud: save() menandai kotor -> diunggah tiap ±12 dtk (+ saat aplikasi ditutup/disembunyikan).
     Server memegang nomor versi (sv). Bila versi server lebih baru (diubah admin lewat Telegram atau dimainkan
     di perangkat lain) -> data server dipakai.
   • Dunia bot: {epoch, gen} + UID & username setiap bot dari server (sama untuk semua pemain).
     Ubahan admin untuk bot (lv/cp/vip/sembunyi) diterapkan di atas hasil simulasi.
   • Ping tiap 20 dtk: versi data, jumlah pesan & permintaan teman baru, id obrolan dunia terakhir, generasi bot.
   • Tindakan bot terhadap pertemanan (meminta / menerima / menolak) dihitung di sini secara deterministik
     (hash bot + UID pemain), hanya saat bot sedang online, lalu dicatat di server.
   Tamu: tidak ada akun; semua fitur sosial meminta masuk/daftar.
   ===================================================================== */
const NET={acct:null,dirty:false,pushAt:0,pushing:false,pingAt:0,sv:0,fr:0,dm:0,wc:0,wcSeen:0,players:[],plAt:0,
 friends:{friends:[],inc:[],out:[]},frAt:0,worldAt:0,worldOk:false,snapAt:0,pend:null,ban:false};
const ACCT_KEY='aster_acct',WORLD_KEY='aster_world2';
const netApi=()=>(typeof TOPUP_CFG!=='undefined'&&TOPUP_CFG.api||'').replace(/\/$/,'');
async function api(path,body,opt={}){if(!netApi())return{ok:false,e:'net'};
 try{const r=await fetch(netApi()+path,body!==undefined?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),keepalive:!!opt.keep}:{cache:'no-store'});
  const o=await r.json();if(o&&o.e==='ban')netBanned();else if(o&&o.e==='auth'&&NET.acct&&body&&body.tok)netSessionLost();return o}catch(e){return{ok:false,e:'net'}}}
const netTok=()=>NET.acct&&NET.acct.tok;
const loggedIn=()=>!!(NET.acct&&NET.acct.tok);
function acctLoad(){try{const a=JSON.parse(localStorage.getItem(ACCT_KEY)||'null');NET.acct=a&&a.tok?a:null}catch(e){NET.acct=null}}
function acctSave(){try{NET.acct?localStorage.setItem(ACCT_KEY,JSON.stringify(NET.acct)):localStorage.removeItem(ACCT_KEY)}catch(e){}}
acctLoad();

/* ---------------- potret profil publik (dilihat pemain lain & admin) ---------------- */
function netProf(){const team=S.team.filter(Boolean),heroes={},weapons={},gear={};
 for(const id in S.heroes){const h=S.heroes[id];heroes[id]={lv:h.lv||1,lb:h.lb||0,asc:h.asc||0,wpn:h.wpn||null,ar:h.ar||null,ac:h.ac||null};
  if(h.wpn&&S.weapons[h.wpn]){const w=S.weapons[h.wpn];weapons[h.wpn]={lv:w.lv||1,lb:w.lb||0,ref:w.ref||0,asc:w.asc||0}}
  for(const k of['ar','ac'])if(h[k]&&S.gear[h[k]])gear[h[k]]={lv:S.gear[h[k]].lv||0,asc:S.gear[h[k]].asc||0}}
 let st=null;for(const s of SLIST)if(S.stages[s.key])st=s.key;
 return{lv:S.lv,cp:teamPow(),vip:vipOf(S.iap&&S.iap.spent||0),top:S.homeHero&&S.heroes[S.homeHero]?S.homeHero:team[0]||null,team,heroes,weapons,gear,stage:st||'-',
  days:S.loginDays||1,nh:Object.keys(S.heroes).length,nw:Object.keys(S.weapons).length,ng:Object.keys(S.gear).length,ar:S.arena&&S.arena.pts||0,bio:S.bio||''}}
const saveBody=()=>{const o=Object.assign({},S);delete o.acct;return o};

/* ---------------- sinkron simpanan ---------------- */
function netMarkDirty(){if(loggedIn())NET.dirty=true}
async function netPush(force,keep){if(!loggedIn()||NET.pushing||(!NET.dirty&&!force)||NET.pend)return;NET.pushing=true;NET.dirty=false;NET.pushAt=Date.now();
 try{const o=await api('/api/save',{tok:netTok(),base:NET.acct.sv,save:saveBody(),prof:netProf()},{keep});
  if(o.ok){NET.acct.sv=o.sv;acctSave()}else if(o.conflict){if(o.save)netAdopt(o.save,o.sv);else{NET.acct.sv=o.sv;acctSave();NET.dirty=true}}else NET.dirty=true}
 finally{NET.pushing=false}}
// pakai data dari server (admin mengubah lewat Telegram / perangkat lain). Ditunda selama battle/cerita berlangsung.
function netAdopt(save,sv){if(!save)return;if((typeof B!=='undefined'&&B)||(typeof SP!=='undefined'&&SP)){NET.pend={save,sv};return}
 NET.pend=null;const lang=S&&S.lang;S=Object.assign(defState(),save);S.se=SAVE_SE;if(lang)S.lang=lang;try{migrate()}catch(e){}NET.acct.sv=sv;acctSave();
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}
 const L=document.getElementById('login');if(L&&L.classList.contains('on'))return;
 try{if($('#modal').classList.contains('on'))closeModal()}catch(e){}try{refreshScreen()}catch(e){}toast(T('Data akunmu diperbarui dari server'))}
async function netPull(){const o=await api('/api/load',{tok:netTok()});if(o.ok&&o.save&&o.sv!==NET.acct.sv)netAdopt(o.save,o.sv)}
function netBanned(){if(NET.ban)return;NET.ban=true;const was=loggedIn();netClearLocal();if(was)setTimeout(()=>{try{backToLogin()}catch(e){}setTimeout(()=>modal(`<h3>${T('Akun Diblokir')}</h3><p style="text-align:center">${T('Akun ini diblokir oleh admin.')}</p><div class="mrow"><button class="btn" data-act="closeModal">OK</button></div>`),1800)},50)}
function netSessionLost(){if(!loggedIn())return;netClearLocal();setTimeout(()=>{try{backToLogin()}catch(e){}setTimeout(()=>toast(T('Sesi berakhir. Silakan masuk lagi.')),1800)},50)}
// keluar: data lokal dibersihkan (data aman di server)
function netClearLocal(){NET.acct=null;acctSave();NET.dirty=false;NET.pend=null;NET.friends={friends:[],inc:[],out:[]};NET.fr=NET.dm=0;
 try{localStorage.removeItem(SAVE_KEY)}catch(e){}const lg=S&&S.lang;newGame();if(lg)S.lang=lg;S.uid=''}
async function netLogout(){if(loggedIn()){await netPush(true);await api('/api/acc/logout',{tok:netTok()})}netClearLocal();backToLogin()}

/* ---------------- daftar / masuk ---------------- */
const ERR_TXT={uname:'Username harus 3–12 huruf atau angka, tanpa spasi.',pw:'Password minimal 6 karakter.',taken:'Username sudah dipakai.',cred:'Username atau password salah.',
 botacc:'Akun ini tidak bisa dipakai masuk.',ban:'Akun ini diblokir oleh admin.',slow:'Terlalu banyak percobaan. Coba lagi 10 menit lagi.',net:'Tidak bisa terhubung ke server. Periksa internet.',empty:'Isi username dan password.',server:'Server sedang bermasalah. Coba lagi.'};
const netErr=e=>T(ERR_TXT[e]||'Terjadi kesalahan.');
async function netRegister(u,p,keep){const body={u,p};if(keep){S.name=u;S.named=true;body.save=saveBody();body.prof=netProf()}
 const o=await api('/api/acc/register',body);if(!o.ok)return o;NET.ban=false;NET.acct={uid:o.uid,u:o.u,tok:o.tok,sv:o.sv};acctSave();
 if(!keep){const lg=S.lang;newGame();S.lang=lg}S.name=o.u;S.named=true;S.uid=o.uid;save();NET.dirty=true;netPush(true);return o}
async function netLogin(u,p){const o=await api('/api/acc/login',{u,p});if(!o.ok)return o;NET.ban=false;NET.acct={uid:o.uid,u:o.u,tok:o.tok,sv:o.sv};acctSave();
 const lg=S.lang;if(o.save&&o.save.heroes){S=Object.assign(defState(),o.save);S.se=SAVE_SE;try{migrate()}catch(e){}}else{newGame();S.lang=lg}
 S.name=o.u;S.named=true;S.uid=o.uid;try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}if(!o.save)NET.dirty=true;return o}

/* ---------------- dunia bot dari server ---------------- */
function netApplyWorld(d,full){if(!d||!d.ok)return;const L=d.bots||[];
 if(full||d.from===0){BOTS.uids=L.map(x=>x[0]);BOTS.srvNames=L.map(x=>x[1])}else{for(let k=0;k<L.length;k++){BOTS.uids[d.from+k]=L[k][0];BOTS.srvNames[d.from+k]=L[k][1]}}
 BOTS.ov=d.ov||{};BOTS.uidIdx=null;BOTS.cache={};
 botsApplyWorld({epoch:d.epoch,gen:d.gen});BOTS.names=BOTS.srvNames.slice();BOTS.nameSet=null;BOTS.ready=true;NET.worldOk=true;NET.gen=d.gen;
 try{localStorage.setItem(WORLD_KEY,JSON.stringify({epoch:d.epoch,gen:d.gen,bots:BOTS.uids.map((u,k)=>[u,BOTS.srvNames[k]]),ov:BOTS.ov}))}catch(e){}
 BOTS.onChange&&BOTS.onChange()}
function netWorldCache(){try{const c=JSON.parse(localStorage.getItem(WORLD_KEY)||'null');if(c&&c.bots)netApplyWorld({ok:true,from:0,...c},true)}catch(e){}}
async function netWorld(full){NET.worldAt=Date.now();const from=full||!BOTS.uids?0:BOTS.uids.length;const d=await api('/api/world?from='+from);
 if(d.ok){if(BOTS.uids&&d.gen!==NET.gen)return netWorld(true);netApplyWorld(d,from===0)}return d.ok}
const botUid=i=>BOTS.uids&&BOTS.uids[i];
function botIdxOf(uid){if(!BOTS.uids)return-1;if(!BOTS.uidIdx){BOTS.uidIdx=new Map();BOTS.uids.forEach((u,k)=>BOTS.uidIdx.set(u,k))}const k=BOTS.uidIdx.get(uid);return k==null?-1:k}
const botOv=i=>BOTS.ov&&BOTS.ov[i]||null;
const botHidden=i=>{const o=botOv(i);return!!(o&&o.ban)};

/* ---------------- pemain asli (peringkat) ---------------- */
async function netPlayers(force){if(!force&&Date.now()-NET.plAt<45e3)return;NET.plAt=Date.now();const o=await api('/api/players');if(o.ok){NET.players=o.list||[];BOTS.onChange&&BOTS.onChange()}}

/* ---------------- teman ---------------- */
async function netFriends(){if(!loggedIn())return NET.friends;const o=await api('/api/fr/list',{tok:netTok()});if(o.ok){NET.friends={friends:o.friends,inc:o.inc,out:o.out};NET.frAt=Date.now();NET.fr=o.inc.length}return NET.friends}
const isFriend=uid=>NET.friends.friends.some(f=>f.uid===uid);
const frState=uid=>isFriend(uid)?'ok':NET.friends.out.some(f=>f.uid===uid)?'out':NET.friends.inc.some(f=>f.uid===uid)?'inc':null;
// keputusan bot: menerima permintaanku (±70%, lebih mudah bila CP-ku mendekati CP-nya) saat ia online
function botAccepts(i){const s=botState(i),me=teamPow(),r=bHash(i,7700+(+NET.acct.uid%100000))%100;const near=me>=s.cp*.5?12:me>=s.cp*.2?0:-15;return r<62+near}
const BFR_KEY='aster_botfr';
async function netBotFriends(){if(!loggedIn()||!botsWarmOk()||!BOTS.uids)return;const now=Date.now();let changed=false;
 // 1) jawab permintaanku yang menunggu, hanya saat bot itu sudah online setelah permintaan dikirim
 for(const f of NET.friends.out){if(f.bot==null)continue;const i=f.bot;if(!(i<botsVisible())||botHidden(i))continue;const pr=botPresence(i,now);
  if(!(pr.online||pr.last>f.ts+6e4))continue;const ok=botAccepts(i);
  const o=await api('/api/fr/bot',{tok:netTok(),uid:f.uid,act:ok?'ok':'no'});if(o.ok){changed=true;if(o.st==='ok')toast(T('{n} menerima permintaan pertemananmu!',{n:botName(i)}))}}
 // 2) bot mengajak berteman: 0–2 bot per hari (acak per pemain), dikirim saat sesi pertama bot itu hari ini dimulai
 let done={};try{done=JSON.parse(localStorage.getItem(BFR_KEY)||'{}')}catch(e){}const d=wibDay(now),seed=+NET.acct.uid%1000003,n=botsVisible();
 if(n>5){const k=[0,0,1,1,1,2][bHash(seed,8800+d)%6];
  for(let j=0;j<k;j++){const i=bHash(seed,8900+d*7+j)%n,key=NET.gen+':'+d+':'+i;if(done[key]||botHidden(i))continue;const ss=botSessions(botBase(i),d);if(!ss.length){done[key]=1;continue}
   if(ss[0][0]>now)continue;done[key]=1;const uid=botUid(i);if(!uid||frState(uid))continue;
   const o=await api('/api/fr/bot',{tok:netTok(),uid,act:'req'});if(o.ok&&o.st==='req'){changed=true;toast(T('{n} ingin berteman denganmu',{n:botName(i)}))}}
  for(const x in done)if(+x.split(':')[1]<d-3)delete done[x];try{localStorage.setItem(BFR_KEY,JSON.stringify(done))}catch(e){}}
 if(changed){await netFriends();refreshBadges()}}

/* ---------------- potret bot untuk admin ---------------- */
async function netBotSnap(){if(!loggedIn()||!botsWarmOk()||Date.now()-NET.snapAt<15*6e4)return;NET.snapAt=Date.now();const now=Date.now(),n=botsVisible(),L=[];
 for(let i=0;i<n;i++)L.push(i);const fr=new Set(NET.friends.friends.concat(NET.friends.out,NET.friends.inc).filter(f=>f.bot!=null).map(f=>f.bot));
 const pick=L.map(i=>[i,botState(i,now).cp]).sort((a,b)=>b[1]-a[1]).slice(0,100).map(x=>x[0]);fr.forEach(i=>{if(i<n&&!pick.includes(i))pick.push(i)});
 const list=pick.slice(0,120).map(i=>{const s=botState(i,now);return{i,lv:s.lv,cp:s.cp,vip:s.stats.vip,top:s.fav||s.team[0],stage:s.stage,team:s.team.map(id=>HD[id]?HD[id].name:id),online:botPresence(i,now).online}});
 api('/api/bots/snap',{tok:netTok(),list})}

/* ---------------- ping & loop ---------------- */
async function netPing(){if(!loggedIn())return;NET.pingAt=Date.now();const o=await api('/api/ping',{tok:netTok()});if(!o.ok)return;
 if(o.u&&o.u!==NET.acct.u){NET.acct.u=o.u;acctSave()}
 if(o.sv!==NET.acct.sv&&!NET.pushing)await netPull();
 if(NET.gen!=null&&o.gen!==NET.gen)netWorld(true);
 const frUp=o.fr>NET.fr,dmUp=o.dm>NET.dm;if(frUp){toast(T('Ada permintaan pertemanan baru'));netFriends()}if(dmUp&&!(typeof dmOpenWith!=='undefined'&&dmOpenWith))toast(T('Pesan baru masuk'));
 NET.fr=o.fr;NET.dm=o.dm;NET.wc=o.wc;NET.ai=!!o.ai;refreshBadges()}
function refreshBadges(){try{const b=document.getElementById('frBadge');if(b){const n=NET.fr+NET.dm;b.textContent=n>99?'99+':n;b.style.display=n?'':'none'}}catch(e){}}
let netLoopOn=false;
function netStart(){if(netLoopOn)return;netLoopOn=true;netWorldCache();netWorld();
 setInterval(()=>{const L=document.getElementById('login');if(NET.pend&&!(typeof B!=='undefined'&&B)&&!(typeof SP!=='undefined'&&SP))netAdopt(NET.pend.save,NET.pend.sv);
  if(!loggedIn()||(L&&L.classList.contains('on')))return;const now=Date.now();
  if(NET.dirty&&now-NET.pushAt>12e3)netPush();
  if(now-NET.pingAt>20e3)netPing();
  if(now-NET.frAt>90e3)netFriends().then(()=>netBotFriends());
  if(now-NET.worldAt>3*6e4)netWorld();
  netBotSnap()},4000);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&NET.dirty)netPush(false,true)});
 window.addEventListener('pagehide',()=>{if(NET.dirty)netPush(false,true)})}
