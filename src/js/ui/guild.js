/* =====================================================================
   GUILD — tampilan: Aula (absen, donasi, pengumuman, kabar), Anggota (jabatan, lamaran, mosi kudeta),
   Obrolan (pemain + kalimat bot + balasan AI), Peringkat (Level / Total CP), Toko Koin Guild,
   Daftar & Buat guild, Undangan. Logika di systems/guild.js, buku besar di server.
   ===================================================================== */
ICON.guild=gEmb(13);
ICON.gcoin=pxIcon(K=>{K.ball(8,8,5.6,['#d8f0ff','#5ab0e0','#2a6a9a']);K.ring(8,8,3.6,4.4,'#2a6a9a');K.poly([[8,4.5],[11,8],[8,11.5],[5,8]],'#fff8e6');K.poly([[8,6.2],[9.6,8],[8,9.8],[6.4,8]],'#8ad0ff')});
let gTab='aula',gRankBy='cp',gView=null,gChatTimer=null,gChatList=[],gChatSeen=0,gEmbPick=0,gNew={mode:0,minlv:G_CFG.minLv},gN=60;
const gCoin=()=>S.gcoin||0;
const gIc=(g,sz=22)=>`<img class="px gemb" src="${gEmb(g.emb)}" style="width:${sz}px;height:${sz}px">`;
const gRoleB=r=>r>0?`<i class="grole r${r}">${T(G_ROLE[r])}</i>`:'';
function gXpBar(g){const lv=g.lv,a=G_CFG.xp[lv]||0,b=G_CFG.xp[lv+1];if(!b)return`<div class="gxp"><i style="width:100%"></i><em>${T('Level maks')}</em></div>`;return`<div class="gxp"><i style="width:${Math.min(100,(g.xp-a)/(b-a)*100)}%"></i><em>${fmt(g.xp-a)} / ${fmt(b-a)} XP</em></div>`}
function gNeedReady(cb){if(!loggedIn())return needAcct(),false;if(!gReady()||!botsWarmOk()){modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Guild')}</h3><p class="sub" style="text-align:center;padding:30px 0">${T('Memuat guild...')}</p>`);
  botsInit();botsEnsure();Promise.all([gLoad(true),relLoad(),new Promise(r=>botsWarm(r))]).then(()=>{if($('#modal').classList.contains('on'))cb()});return false}return true}
function openGuild(tab){if(!gNeedReady(()=>openGuild(tab)))return;const me=gMine();
 if(tab)gTab=tab;const T1=me?['aula','mem','chat','rank','shop']:['find','make','rank','inv'];if(!T1.includes(gTab))gTab=T1[0];gView=null;
 const dot=k=>k==='chat'&&me&&NET.gcm>(S.gcSeen||0)||k==='inv'&&(S.gOffer||[]).length||k==='mem'&&GS.info[me&&me.id]&&GS.info[me.id].apps&&GS.info[me.id].apps.length||k==='aula'&&me&&gVoteOf(me.id)?'<i class="dot"></i>':'';
 const lab={aula:T('Aula'),mem:T('Anggota'),chat:T('Obrolan'),rank:T('Peringkat'),shop:T('Toko'),find:T('Cari Guild'),make:T('Buat'),inv:T('Undangan')};
 const head=me?`<h3 class="gdh">${gIc(me,28)} <span><b>${esc(me.name)}</b><small>Lv ${me.lv} · S${netSrv()}</small></span></h3>`:`<h3><img class="ix" src="${ICON.guild}" style="width:26px;height:26px"> ${T('Guild')}</h3>`;
 const html=`<button class="btn red mclose" data-act="closeModal">✕</button>${head}<div class="mtabs gtabs">${T1.map(k=>`<button class="btn ${gTab===k?'':'blue'}" data-act="gTab" data-arg="${k}">${lab[k]}${dot(k)}</button>`).join('')}</div><div id="gdBody">${gBodyHTML()}</div>`;
 const box=$('#gdBody')&&$('#modal').classList.contains('on')?$('#modal .mbox'):null;if(box)box.innerHTML=html;else{modal(html);$('#modal .mbox').classList.add('gdbox')}
 gAfter()}
function guildRefresh(){if(!$('#gdBody'))return;const sc=$('#gdScroll'),top=sc?sc.scrollTop:0;if(gView!=null){gViewOpen(gView,true);return}openGuild();const s2=$('#gdScroll');if(s2)s2.scrollTop=top}
function gBodyHTML(){const me=gMine();
 if(gTab==='aula')return gAulaHTML(me);if(gTab==='mem')return gMemHTML(me);if(gTab==='chat')return gChatHTML(me);if(gTab==='rank')return gRankHTML();if(gTab==='shop')return gShopHTML(me);
 if(gTab==='find')return gFindHTML();if(gTab==='make')return gMakeHTML();return gInvHTML()}
// isi yang dimuat setelah tampil (rincian guild, obrolan)
function gAfter(){const me=gMine();clearInterval(gChatTimer);gChatTimer=null;
 if(me&&(gTab==='aula'||gTab==='mem')&&(!GS.info[me.id]||Date.now()-GS.infoAt[me.id]>15e3))gInfo(me.id,true).then(()=>{if($('#gdBody')&&(gTab==='aula'||gTab==='mem')&&gView==null)$('#gdBody').innerHTML=gBodyHTML()});
 if(me&&gTab==='chat'){gChatPoll(true);gChatTimer=setInterval(()=>{if(!$('#gcList')){clearInterval(gChatTimer);gChatTimer=null;return}gChatPoll()},4000);const f=$('#gcForm');if(f)f.onsubmit=gChatSend}
 if(gTab==='inv'&&!gInvHTML.apps)api('/api/g/myapps',{tok:netTok()}).then(o=>{gInvHTML.apps=(o&&o.list)||[];if($('#gdBody')&&gTab==='inv')$('#gdBody').innerHTML=gBodyHTML()});
 if(gTab==='find'){const f=$('#gfFind');if(f)f.oninput=()=>{const b=$('#gfList');if(b)b.innerHTML=gFindRows(f.value)}}}

/* ---------- Aula ---------- */
function gVoteHTML(me,v,info){if(!v)return'';const vf=info&&info.vote&&info.vote.id===v.id?info.vote:null,now=Date.now(),nm=u=>esc(gMemInfo({uid:u}).name);
 const cnt=O=>Object.values(O||{}).filter(t=>t<=now).length,y=vf?cnt(vf.yes):0,n=vf?cnt(vf.no):0,mine=vf&&(vf.yes[NET.acct.uid]!=null?1:vf.no[NET.acct.uid]!=null?0:null);
 const isWho=v.who===NET.acct.uid,isTgt=v.tgt===NET.acct.uid;
 return`<div class="gvote"><b>🗳 ${T('Mosi Kudeta')}</b><p>${T('{a} ingin menggulingkan ketua {b}.',{a:'<b>'+(isWho?T('Kamu'):nm(v.who))+'</b>',b:'<b>'+(isTgt?T('kamu'):nm(v.tgt))+'</b>'})} ${T('Berakhir {t}',{t:new Date(v.t1).toTimeString().slice(0,5)})}</p>
 <div class="gvbar"><i style="width:${y+n?y/(y+n)*100:50}%"></i><span>${T('Setuju')} ${y}</span><span>${T('Tolak')} ${n}</span></div>
 <div class="mrow">${isWho?'':`<button class="btn green sm${mine===1?' on':''}" data-act="gVote" data-arg="1">${T('Setuju')}</button><button class="btn red sm${mine===0?' on':''}" data-act="gVote" data-arg="0">${T('Tolak')}</button>`}<button class="btn blue sm" data-act="gTab" data-arg="mem">${T('Bujuk anggota')}</button></div></div>`}
function gAulaHTML(me){if(!me)return'';const P=gPow(me),info=GS.info[me.id],g=info&&info.g||{},v=gVoteOf(me.id),r=gRoleOf(NET.acct.uid),ci=S.gci===gToday()||info&&info.me&&info.me.ci,don=info&&info.me?info.me.don:0;
 const lead=gMemInfo({uid:me.lead});
 return`<div id="gdScroll" class="gdscroll"><div class="gcard">${gIc(me,54)}<div class="gci"><b>${esc(me.name)}</b><span>Lv ${me.lv} · ${me.M.length}/${me.cap} ${T('anggota')} · ${T(G_MODE[me.mode])}</span>${gXpBar(me)}
  <span>${T('Ketua')}: <b>${esc(lead.name)}</b> · CP ${T('total')} <b>${fmt(P.cp)}</b></span><span>${T('Peringkat')} CP <b>#${P.rk}</b> · Level <b>#${P.rkLv}</b> · <i class="on"></i> ${P.on} ${T('online')}</span></div></div>
 <div class="gnote">${g.note?`📢 ${esc(g.note)}`:`<i>${T('Belum ada pengumuman.')}</i>`}${r>=2?` <button class="lnk" data-act="gEditOpen">✎</button>`:''}</div>
 ${gVoteHTML(me,v,info)}
 <div class="sec">${T('Absen & Donasi')} <span class="gcbal"><img class="ix" src="${ICON.gcoin}"> ${fmt(gCoin())}</span></div>
 <div class="gdon"><button class="btn ${ci?'gray':'green'}" data-act="gCheckIn"${ci?' disabled':''}><b>${ci?T('Sudah absen'):T('Absen Harian')}</b><small>+${fmt(G_CFG.ci.gold(me.lv))} ${T('emas')} · +${G_CFG.ci.coin(me.lv)} ${T('koin')} · +10 XP</small></button>
  ${[1,2,3].map(k=>{const d=G_CFG.don[k],done=don&(1<<k);return`<button class="btn ${done?'gray':'blue'}" data-act="gDonate" data-arg="${k}"${done?' disabled':''}><b>${d.gold?fmt(d.gold)+' '+T('emas'):d.gems+' '+T('permata')}</b><small>+${d.xp} XP · +${d.coin} ${T('koin')}</small></button>`}).join('')}</div>
 <div class="sec">${T('Kabar Guild')}</div><div class="glog">${gLogHTML(info)}</div>
 <div class="mrow">${r===3?`<button class="btn gray sm" data-act="gEditOpen">${T('Pengaturan')}</button>`:''}<button class="btn red sm" data-act="gLeave">${r===3&&me.M.length===1?T('Bubarkan'):T('Keluar Guild')}</button></div></div>`}
function gLogTxt(e){const nm=u=>u?esc(String(u).split(',').slice(0,3).map(x=>gMemInfo({uid:x}).name).join(', ')+(String(u).split(',').length>3?' +'+(String(u).split(',').length-3):'')):'';
 const x=e.x||'';switch(e.ty){case'found':return T('{a} mendirikan guild {n}',{a:nm(e.a),n:esc(x)});case'j':return e.b?T('{a} bergabung (diajak {b})',{a:nm(e.a),b:nm(e.b)}):T('{a} bergabung',{a:nm(e.a)});
  case'l':return /^dibujuk/.test(x)?T('{a} dibujuk pindah ke guild lain',{a:nm(e.a)}):T('{a} keluar',{a:nm(e.a)})+(x&&!/^dibujuk/.test(x)?` (${esc(x)})`:'');case'k':return T('{a} dikeluarkan oleh {b}',{a:nm(e.a),b:nm(e.b)})+(x?` (${esc(x)})`:'');
  case'up':return T('{a} diangkat jadi {r}',{a:nm(e.a),r:T(G_ROLE[+x]||'')});case'down':return T('{a} diturunkan jadi {r}',{a:nm(e.a),r:T(G_ROLE[+x]||'')});
  case'L':return x==='serah'?T('{b} menyerahkan jabatan ketua ke {a}',{a:nm(e.a),b:nm(e.b)}):x==='coup'?T('{a} menjadi ketua lewat kudeta',{a:nm(e.a)}):T('{a} menjadi ketua menggantikan {b}',{a:nm(e.a),b:nm(e.b)});
  case'lvup':return T('Guild naik ke Lv {n}!',{n:esc(x)});case'note':return T('{a} mengganti pengumuman',{a:nm(e.a)});case'vote':return T('{a} memulai mosi kudeta terhadap {b}',{a:nm(e.a),b:nm(e.b)});
  case'coup':return T('Kudeta berhasil! {a} menggulingkan {b} ({x})',{a:nm(e.a),b:nm(e.b),x:esc(x)});case'coupno':return T('Mosi kudeta {a} gagal ({x})',{a:nm(e.a),x:esc(x)});case'd':return T('Guild bubar');default:return esc(e.ty)}}
function gLogHTML(info){const L=(info&&info.log)||[];if(!info)return`<p class="sub frempty">${T('Memuat...')}</p>`;return L.length?L.slice(0,30).map(e=>`<div class="glr t-${e.ty}"><small>${agoMs(Date.now()-e.ts)}</small><span>${gLogTxt(e)}</span></div>`).join(''):`<p class="sub frempty">${T('Belum ada kabar.')}</p>`}

/* ---------- Anggota ---------- */
function gMemRows(g,info,act){const now=Date.now(),myR=gRoleOf(NET.acct.uid),v=gVoteOf(g.id),vf=info&&info.vote&&v&&info.vote.id===v.id?info.vote:null;
 const L=g.M.map(m=>({m,x:gMemInfo(m,now),c:(info&&info.mem.find(z=>z.uid===m.uid))||{}})).sort((a,b)=>b.m.role-a.m.role||b.x.cp-a.x.cp);
 return L.slice(0,gN).map(({m,x,c})=>{const bot=x.i!=null,contrib=bot?gBotContrib(x.i,m,now):(c.contrib||0);
  let btn='';if(act&&m.uid!==NET.acct.uid){
   if(vf&&bot&&m.uid!==v.who&&m.uid!==v.tgt)btn+=`<button class="btn sm ${vf.yes[m.uid]!=null&&vf.yes[m.uid]<=now?'green':vf.no[m.uid]!=null&&vf.no[m.uid]<=now?'red':'gray'}" data-act="gSway" data-arg="${m.uid}">${T('Bujuk')}</button>`;
   if(myR===3)btn+=`<button class="btn sm blue" data-act="gMemAct" data-arg="${m.uid}">⋯</button>`;else if(myR===2&&m.role<2)btn+=`<button class="btn sm red" data-act="gKick" data-arg="${m.uid}">✕</button>`}
  return`<div class="frrow gmrow"><button class="frmain" data-act="profView" data-arg="${m.uid}"><span class="rkav">${x.top&&HD[x.top]?`<img class="px" src="${portrait(x.top)}">`:''}${x.online?'<i class="on"></i>':''}</span>
  <span class="rknm"><b>${x.vip?`<i class="vip v${Math.min(7,x.vip)}">VIP${x.vip}</i>`:''}${esc(x.name)}${gRoleB(m.role)}</b><small>Lv ${x.lv} · CP ${fmt(x.cp)} · ${x.online?`<em class="ok">${T('Online')}</em>`:T('Aktif {t}',{t:agoMs(now-x.last)})} · ${T('Kontribusi')} ${fmt(contrib)}</small></span></button><span class="frbt">${btn}</span></div>`}).join('')+(g.M.length>gN?`<div class="mrow"><button class="btn blue sm" data-act="gMore">${T('Tampilkan semua')}</button></div>`:'')}
// kontribusi bot (perkiraan dari lama bergabung & kebiasaan absen — sama di semua game)
function gBotContrib(i,m,now){const days=Math.max(0,(now-m.joined)/BDAY),b=botBase(i),act=Math.min(1,.35+(b.a||1)*.25);let s=0;const d0=wibDay(m.joined);for(let d=d0;d<=wibDay(now)&&d<d0+60;d++)if(bHash(i,d*3+1)%100<act*100)s+=10+gDonXp({i},d);return Math.round(days<1?s*.5:s)}
function gMemHTML(me){if(!me)return'';const info=GS.info[me.id],r=gRoleOf(NET.acct.uid),v=gVoteOf(me.id),apps=info&&info.apps||[];
 const mmJoin=GS.mem.get(NET.acct.uid),canVote=r<3&&!v&&mmJoin&&Date.now()-mmJoin.joined>BDAY;
 return`<div id="gdScroll" class="gdscroll">${v?gVoteHTML(me,v,info):''}
 ${apps.length?`<div class="sec">${T('Lamaran Masuk')} · ${apps.length}</div><div class="frlist">${apps.map(p=>{const i=botIdxOf(p.uid);const nm=i>=0?botName(i):p.u,s=i>=0?botSum(i):p;return`<div class="frrow"><button class="frmain" data-act="profView" data-arg="${p.uid}"><span class="rknm"><b>${esc(nm)}</b><small>Lv ${s.lv} · CP ${fmt(s.cp)}</small></span></button><span class="frbt"><button class="btn sm green" data-act="gApp" data-arg="${p.uid}:1">✓</button><button class="btn sm red" data-act="gApp" data-arg="${p.uid}:0">✕</button></span></div>`}).join('')}</div>`:''}
 <div class="sec">${T('Anggota')} · ${me.M.length}/${me.cap}</div><div class="frlist">${gMemRows(me,info,true)}</div>
 <div class="mrow">${canVote?`<button class="btn red sm" data-act="gVoteAsk">🗳 ${T('Mulai Mosi Kudeta')}</button>`:''}<button class="btn sm" data-act="gRecruit">+ ${T('Rekrut Pemain')}</button></div></div>`}

/* ---------- Obrolan guild ---------- */
function gChatHTML(me){return`<div class="chlist gclist" id="gcList"><p class="sub frempty">${T('Memuat obrolan...')}</p></div><p class="gctyping" id="gcTyping">${T('sedang mengetik...')}</p>
 <form class="chin" id="gcForm"><input id="gcIn" maxlength="200" autocomplete="off" placeholder="${T('Tulis pesan ke guild...')}"><button class="btn" type="submit">${T('Kirim')}</button></form>`}
async function gChatPoll(force){const me=gMine();if(!me)return;const o=await api('/api/g/chat',{tok:netTok(),since:force?0:gChatSeen});if(!o||!o.ok)return;
 if(force||GS.chatGid!==me.id){gChatList=[];GS.chatGid=me.id}for(const m of o.list)if(!gChatList.some(x=>x.id===m.id))gChatList.push(m);if(o.list.length)gChatSeen=Math.max(gChatSeen,...o.list.map(m=>m.ts));
 const now=Date.now(),info=GS.info[me.id]||await gInfo(me.id),V=gVirt(me,info,now-20*36e5,now),all=gChatList.concat(V).sort((a,b)=>a.ts-b.ts).slice(-120),box=$('#gcList');if(!box)return;
 const near=force||box.scrollHeight-box.scrollTop-box.clientHeight<80;
 box.innerHTML=all.length?all.map(m=>{const mine=loggedIn()&&m.uid===NET.acct.uid,i=botIdxOf(m.uid),r=gRoleOf(m.uid),x=gMemInfo({uid:m.uid},now);return`<div class="chm${mine?' self':''}">${mine?'':`<button class="chav" data-act="profView" data-arg="${m.uid}">${x.top&&HD[x.top]?`<img class="px" src="${portrait(x.top)}">`:''}</button>`}<div class="chb"><div class="chn"><button data-act="profView" data-arg="${m.uid}"><b>${esc(mine?S.name:i>=0?botName(i):m.u)}</b></button>${gRoleB(r)}<small>${chTime(m.ts)}</small></div><p>${esc(m.txt)}</p></div></div>`}).join(''):`<p class="sub frempty">${T('Belum ada obrolan. Sapa anggotamu!')}</p>`;
 if(near)box.scrollTop=box.scrollHeight;const ty=$('#gcTyping');if(ty)ty.classList.toggle('on',!!o.typing);S.gcSeen=Math.max(S.gcSeen||0,NET.gcm||0,...gChatList.map(m=>m.ts));}
async function gChatSend(e){e.preventDefault();const i=$('#gcIn'),v=(i.value||'').trim();if(!v)return;i.value='';sfx('tap');
 const o=await api('/api/g/say',{tok:netTok(),txt:v});if(!o||!o.ok){i.value=v;toast(o&&o.e==='fast'?T('Pelan-pelan, tunggu sebentar.'):netErr(o&&o.e));return}gChatPoll();
 // anggota bot yang sedang online menanggapi (AI DM + Guild nyala)
 if(NET.aig)setTimeout(()=>gChatAI(v),400)}
async function gChatAI(txt){const me=gMine();if(!me)return;const now=Date.now(),low=txt.toLowerCase(),v=gVoteOf(me.id),info=GS.info[me.id],P=gPow(me);
 const on=me.M.map(m=>({m,i:botIdxOf(m.uid)})).filter(x=>x.i>=0&&botIn(x.i,now)&&botPres(x.i,now).online);if(!on.length)return;
 const sc=x=>(low.includes(botName(x.i).toLowerCase())?5:0)+x.m.role*.6+gTrait(x.i).soc+Math.random()*.8;on.sort((a,b)=>sc(b)-sc(a));
 const vf=info&&info.vote,cand=on.slice(0,4).map(({m,i})=>{const D=wcDesc(i,now);return{uid:m.uid,name:botName(i),role:m.role,pub:D.pub,priv:D.priv,style:wcStyle(i),lower:wcPersona(i).lower,rel:`${relTier(relEff(m.uid))}${gBestFriends(i,1).length?'; teman akrab '+botName(gBestFriends(i,1)[0].j):''}`,
  vote:vf?(vf.yes[m.uid]!=null?'mendukung':vf.no[m.uid]!=null?'menolak':'belum memilih')+' (kecenderungan '+(gStanceScore(i,v.who,v.tgt,now,me.id)>0?'mendukung':'menolak')+')':''}});
 const lead=gMemInfo({uid:me.lead}).name,voteTxt=v?`${gMemInfo({uid:v.who}).name} ingin menggulingkan ketua ${gMemInfo({uid:v.tgt}).name}, berakhir ${new Date(v.t1).toTimeString().slice(0,5)}`:'';
 const o=await api('/api/g/ai',{tok:netTok(),cand,me:NET.acct.u,mePub:wcMePub(),info:{name:me.name,rank:'#'+P.rk,lead,note:info&&info.g&&info.g.note,voteTxt}});
 if(o&&o.n){const ty=$('#gcTyping');if(ty)ty.classList.add('on');setTimeout(()=>gChatPoll(),2500);if(v)setTimeout(()=>gInfo(me.id,true),Math.max(3e3,(o.at||now)-now+1500))}}

/* ---------- Peringkat guild ---------- */
function gRankList(by){const P=gPowAll();return[...GS.G.values()].sort(by==='lv'?(a,b)=>b.xp-a.xp||P.get(b.id).cp-P.get(a.id).cp:(a,b)=>P.get(b.id).cp-P.get(a.id).cp)}
function gRankRows(by,n=100,act='gViewOpen'){const P=gPowAll(),me=gMine();return gRankList(by).slice(0,n).map((g,k)=>{const p=P.get(g.id);return`<button class="rkrow grk${me&&me.id===g.id?' gmine':''}"${act?` data-act="${act}" data-arg="${g.id}"`:''}><span class="rkn${k<3?' m'+(k+1):''}">${k+1}</span><span class="rkav">${gIc(g,30)}</span><span class="rknm"><b>${esc(g.name)}</b><small>Lv ${g.lv} · ${g.M.length}/${g.cap} · ${T('Ketua')} ${esc(gMemInfo({uid:g.lead}).name)}</small></span><span class="rkv">${by==='lv'?`<b>Lv ${g.lv}</b><small>${fmt(g.xp)} XP</small>`:`<b>${fmt(p.cp)}</b><small>${p.on} ${T('online')}</small>`}</span></button>`}).join('')||`<p class="sub frempty">${T('Belum ada guild di server ini.')}</p>`}
function gRankHTML(){const me=gMine(),P=gPowAll(),L=gRankList(gRankBy),k=me?L.findIndex(g=>g.id===me.id):-1;
 return`<div class="mtabs gsub"><button class="btn sm ${gRankBy==='cp'?'':'blue'}" data-act="gRankBy" data-arg="cp">${T('Total CP')}</button><button class="btn sm ${gRankBy==='lv'?'':'blue'}" data-act="gRankBy" data-arg="lv">${T('Level')}</button></div>
 <div class="rkinfo"><span><em class="rksrv">S${netSrv()}${NET.srvName?' · '+esc(NET.srvName):''}</em> <b>${GS.G.size}</b> ${T('guild')}</span>${me?`<span>${T('Guild-mu')} <b>#${k+1}</b></span>`:''}</div><div id="gdScroll" class="gdscroll rklist">${gRankRows(gRankBy)}</div>`}
// lihat guild lain (dari peringkat / daftar)
async function gViewOpen(gid,keep){gid=+gid;const g=GS.G.get(gid);if(!g)return;gView=gid;const me=gMine();if(me&&me.id===gid&&!keep){gView=null;gTab='aula';openGuild();return}
 const info=await gInfo(gid),P=gPow(g),b=$('#gdBody');if(!b||gView!==gid)return;const can=!me&&S.lv>=g.minlv&&g.M.length<g.cap&&g.mode!==2;
 b.innerHTML=`<div id="gdScroll" class="gdscroll"><button class="btn sm gray" data-act="gBack">‹ ${T('Kembali')}</button><div class="gcard">${gIc(g,54)}<div class="gci"><b>${esc(g.name)}</b><span>Lv ${g.lv} · ${g.M.length}/${g.cap} ${T('anggota')} · ${T(G_MODE[g.mode])} · ${T('min. Lv {n}',{n:g.minlv})}</span>${gXpBar(g)}
  <span>${T('Ketua')}: <b>${esc(gMemInfo({uid:g.lead}).name)}</b> · CP ${T('total')} <b>${fmt(P.cp)}</b></span><span>${T('Peringkat')} CP <b>#${P.rk}</b> · Level <b>#${P.rkLv}</b> · <i class="on"></i> ${P.on} ${T('online')}</span></div></div>
  ${info&&info.g&&info.g.note?`<div class="gnote">📢 ${esc(info.g.note)}</div>`:''}
  ${can?`<div class="mrow"><button class="btn green" data-act="gJoin" data-arg="${g.id}">${g.mode===1?T('Ajukan Lamaran'):T('Gabung')}</button></div>`:!me&&S.lv<g.minlv?`<p class="sub" style="text-align:center">${T('Butuh Lv {n}',{n:g.minlv})}</p>`:''}
  <div class="sec">${T('Anggota')}</div><div class="frlist">${gMemRows(g,info,false)}</div></div>`}

/* ---------- Toko Koin Guild ---------- */
function gShopHTML(me){const d=gToday(),B=S.gshop&&S.gshop.d===d?S.gshop.b:{},lv=me?me.lv:1;
 return`<div class="gcbal big"><img class="ix" src="${ICON.gcoin}"> ${fmt(gCoin())} <small>${T('Koin Guild — dari absen & donasi. Stok reset tiap hari.')}</small></div><div id="gdScroll" class="gdscroll gshop">${G_CFG.shop.map(it=>{const n=B[it.id]||0,left=it.limit-n,lock=(it.lv||1)>lv;
  return`<div class="gsi${lock?' lock':''}"><span class="gsg">${gItemHTML(it.give)}</span><small>${lock?T('Guild Lv {n}',{n:it.lv}):T('Sisa {n}/{m}',{n:left,m:it.limit})}</small><button class="btn sm ${lock||left<=0||gCoin()<it.cost?'gray':''}" data-act="gBuy" data-arg="${it.id}"${lock||left<=0?' disabled':''}><img class="ix" src="${ICON.gcoin}"> ${it.cost}</button></div>`}).join('')}</div>`}

/* ---------- Cari / Buat / Undangan (belum punya guild) ---------- */
function gFindRows(q){const P=gPowAll(),myCp=teamPow(),qq=String(q||'').toLowerCase().trim(),N=Math.max(1,GS.G.size-1);
 const L=[...GS.G.values()].filter(g=>!qq||g.name.toLowerCase().includes(qq)).map(g=>{const p=P.get(g.id),avg=p.cp/Math.max(1,p.n),ok=S.lv>=g.minlv&&g.M.length<g.cap&&g.mode!==2;return{g,p,ok,fit:(ok?0:5)+Math.abs(Math.log((avg+1)/(myCp+1)))}}).sort((a,b)=>a.fit-b.fit).slice(0,60);
 return L.map(({g,p,ok})=>`<div class="frrow"><button class="frmain" data-act="gViewOpen" data-arg="${g.id}"><span class="rkav">${gIc(g,30)}</span><span class="rknm"><b>${esc(g.name)}</b><small>Lv ${g.lv} · ${g.M.length}/${g.cap} · CP ${fmt(p.cp)} · #${p.rk} · ${T(G_MODE[g.mode])}${g.minlv>G_CFG.minLv?' · Lv '+g.minlv+'+':''}</small></span></button><span class="frbt">${ok?`<button class="btn sm green" data-act="gJoin" data-arg="${g.id}">${g.mode===1?T('Lamar'):T('Gabung')}</button>`:''}</span></div>`).join('')||`<p class="sub frempty">${T('Guild tidak ditemukan.')}</p>`}
function gFindHTML(){return`<p class="sub" style="text-align:center">${S.lv<G_CFG.minLv?T('Butuh Lv {n} untuk bergabung.',{n:G_CFG.minLv}):T('Guild yang cocok dengan kekuatanmu tampil paling atas.')}</p><input id="gfFind" class="gfind" maxlength="18" autocomplete="off" placeholder="${T('Cari nama guild...')}"><div id="gdScroll" class="gdscroll frlist" ><div id="gfList">${gFindRows('')}</div></div>`}
function gMakeHTML(){const e=gEmbPick;return`<div id="gdScroll" class="gdscroll gmake"><label>${T('Nama guild')}</label><input id="gmName" maxlength="18" autocomplete="off" placeholder="${T('Huruf & spasi saja, 3–18 karakter')}">
 <label>${T('Lambang')}</label><div class="gembp">${gIc({emb:e},44)}<div><div class="gemr">${G_EMB_C.map((c,k)=>`<button class="gec${Math.floor(e/10)===k?' on':''}" style="background:${c[1]}" data-act="gEmbSet" data-arg="${k*10+e%10}"></button>`).join('')}</div><div class="gemr">${G_EMB_S.map((s,k)=>`<button class="ges${e%10===k?' on':''}" data-act="gEmbSet" data-arg="${Math.floor(e/10)*10+k}"><img class="px" src="${gEmb(Math.floor(e/10)*10+k)}"></button>`).join('')}</div></div></div>
 <label>${T('Cara bergabung')}</label><div class="mtabs gsub">${G_MODE.map((m,k)=>`<button class="btn sm ${gNew.mode===k?'':'blue'}" data-act="gModeSet" data-arg="${k}">${T(m)}</button>`).join('')}</div>
 <label>${T('Pengumuman')}</label><input id="gmNote" maxlength="120" autocomplete="off" placeholder="${T('mis. aktif absen & donasi ya')}">
 <div class="mrow"><button class="btn green" data-act="gCreate">${T('Buat Guild')} · ${icGem()} ${G_CFG.create.gems}</button></div><p class="sub" style="text-align:center">${S.lv<G_CFG.minLv?T('Butuh Lv {n}.',{n:G_CFG.minLv}):''}</p></div>`}
const icGem=()=>ic('gem');
const gItemHTML=g=>g.gold?`${ic('gold')}<b>${fmt(g.gold)}</b><small>${T('Emas')}</small>`:`${ic(shopItemIcon(g))}<b>${esc(shopItemName(g))}</b>`;
function gInvHTML(){const O=(S.gOffer||[]).filter(o=>GS.G.has(o.gid)),A=gInvHTML.apps||[];
 return`<div id="gdScroll" class="gdscroll">${O.length?`<div class="sec">${T('Undangan Guild')}</div><div class="frlist">${O.map(o=>{const g=GS.G.get(o.gid),P=gPow(g),by=gMemInfo({uid:o.by});return`<div class="frrow"><button class="frmain" data-act="gViewOpen" data-arg="${g.id}"><span class="rkav">${gIc(g,30)}</span><span class="rknm"><b>${esc(g.name)}</b><small>${T('Diundang {n}',{n:esc(by.name)})} · Lv ${g.lv} · #${P.rk} · ${g.M.length}/${g.cap}</small></span></button><span class="frbt"><button class="btn sm green" data-act="gOfferOk" data-arg="${g.id}">${T('Terima')}</button><button class="btn sm red" data-act="gOfferNo" data-arg="${g.id}">✕</button></span></div>`}).join('')}</div>`:''}
 ${A.length?`<div class="sec">${T('Lamaranku')}</div><div class="frlist">${A.filter(a=>GS.G.has(a.gid)).map(a=>{const g=GS.G.get(a.gid);return`<div class="frrow"><span class="frmain"><span class="rkav">${gIc(g,30)}</span><span class="rknm"><b>${esc(g.name)}</b><small>${T('Menunggu pengurus')} · ${agoMs(Date.now()-a.ts)}</small></span></span><span class="frbt"><button class="btn sm gray" data-act="gUnapp" data-arg="${g.id}">${T('Batal')}</button></span></div>`}).join('')}</div>`:''}
 ${!O.length&&!A.length?`<p class="sub frempty">${T('Belum ada undangan. Berteman & ngobrol dengan pemain lain — teman yang akrab bisa mengajakmu ke guild mereka.')}</p>`:''}</div>`}

/* ---------- profil bot: guild + ajak ---------- */
function gProfLine(i){if(!gReady())return'';const g=gBotGuild(i),me=gMine(),uid=botUid(i),m=uid&&GS.mem.get(uid),pend=(S.gInvQ||[]).some(x=>x.uid===uid);
 const btn=me&&uid&&(!g||g.id!==me.id)?`<button class="btn sm green" data-act="gInvite" data-arg="${i}"${pend?' disabled':''}>${pend?T('Ajakan terkirim'):'+ '+T('Ajak ke Guild')}</button>`:'';
 return`<div class="gpl">${g?`<button class="gplg" data-act="gViewFrom" data-arg="${g.id}">${gIc(g,20)} <b>${esc(g.name)}</b> ${gRoleB(m.role)}</button>`:`<span class="gplg"><i>${T('Belum punya guild')}</i></span>`}${btn}</div>`}

/* ---------- aksi ---------- */
function gErr(e,o){return{ing:T('Kamu sudah di guild.'),noguild:T('Kamu belum punya guild.'),lv:T('Butuh Lv {n}.',{n:G_CFG.minLv}),glv:T('Level kamu belum cukup untuk guild ini.'),gclosed:T('Guild ini tertutup.'),gfull:T('Guild sudah penuh.'),gname:T('Nama hanya huruf & spasi, 3–18 karakter.'),gtaken:T('Nama guild sudah dipakai.'),
 gcool:T('Baru keluar guild. Bisa bergabung lagi {t}.',{t:o&&o.at?new Date(o.at).toTimeString().slice(0,5):''}),perm:T('Jabatanmu tidak cukup.'),gslot:T('Slot jabatan itu sudah penuh.'),done:T('Sudah dilakukan hari ini.'),gvote:T('Sedang ada mosi.'),gnew:T('Harus jadi anggota minimal 1 hari.'),
 gvcool:T('Mosi baru saja diadakan. Tunggu dulu.'),ginvday:T('Sudah mengajak dia hari ini.'),notbot:T('Pemain ini tidak bisa diajak.'),gself:T('Kamu penggagas mosi ini.'),novote:T('Tidak ada mosi.')}[e]||netErr(e)}
Object.assign(ACT,{
 gTab:k=>{gTab=k;gView=null;gN=60;sfx('tab');openGuild()},
 gRankBy:k=>{gRankBy=k;sfx('tab');openGuild()},
 gMore:()=>{gN=999;const b=$('#gdBody');if(b&&gView==null)b.innerHTML=gBodyHTML();else if(gView!=null)gViewOpen(gView,true)},
 gViewOpen:gid=>{sfx('tap');gViewOpen(gid)},
 gViewFrom:gid=>{gTab=gMine()?'rank':'find';openGuild();gViewOpen(gid)},
 gBack:()=>{gView=null;openGuild()},
 gCheckIn:async()=>{const me=gMine();if(!me)return;const o=await gApi('ci');if(!o||!o.ok){if(o&&o.e==='done'){S.gci=gToday();save();openGuild()}toast(gErr(o&&o.e),1);return}
  if(S.gci!==gToday()){S.gci=gToday();const g=G_CFG.ci.gold(me.lv),c=G_CFG.ci.coin(me.lv);S.gold+=g;S.gcoin=gCoin()+c;save();sfx('claim');toast(T('Absen! +{g} emas · +{c} koin guild',{g:fmt(g),c}))}
  if(o.up)toast(T('Guild naik ke Lv {n}!',{n:o.lv}));delete GS.infoAt[me.id];openGuild()},
 gDonate:async k=>{k=+k;const d=G_CFG.don[k];if(d.gold&&S.gold<d.gold||d.gems&&S.gems<d.gems){toast(d.gold?T('Emas tidak cukup.'):T('Permata tidak cukup.'),1);return}
  const o=await gApi('don',{tier:k});if(!o||!o.ok){toast(gErr(o&&o.e),1);return}if(d.gold)S.gold-=d.gold;if(d.gems)S.gems-=d.gems;S.gcoin=gCoin()+d.coin;save();sfx('claim');
  toast(T('Donasi masuk! +{x} XP guild · +{c} koin',{x:d.xp,c:d.coin}));if(o.up)toast(T('Guild naik ke Lv {n}!',{n:o.lv}));const me=gMine();if(me)delete GS.infoAt[me.id];openGuild()},
 gBuy:id=>{const it=G_CFG.shop.find(x=>x.id===id),d=gToday();if(!it)return;S.gshop=S.gshop&&S.gshop.d===d?S.gshop:{d,b:{}};if((S.gshop.b[id]||0)>=it.limit)return;if(gCoin()<it.cost){toast(T('Koin guild tidak cukup.'),1);return}
  S.gcoin-=it.cost;S.gshop.b[id]=(S.gshop.b[id]||0)+1;grantRw(it.give);save();sfx('claim');toast(T('Dibeli!'));openGuild()},
 gLeave:()=>{const me=gMine();if(!me)return;const lead=gRoleOf(NET.acct.uid)===3,solo=me.M.length===1;
  confirmBox(lead&&!solo?T('Keluar dari guild? Jabatan ketua otomatis turun ke wakil / anggota terlama.'):solo?T('Kamu satu-satunya anggota. Guild akan bubar.'):T('Keluar dari guild {n}?',{n:esc(me.name)}),async()=>{const o=await gApi('leave');if(!o||!o.ok){toast(gErr(o&&o.e),1);return}toast(T('Kamu keluar dari guild.'));gTab='find';openGuild()},T('Keluar'))},
 gJoin:async gid=>{gid=+gid;const o=await gApi('join',{gid});if(!o||!o.ok){toast(gErr(o&&o.e,o),1);return}if(o.st==='app'){toast(T('Lamaran terkirim. Tunggu pengurus guild.'));gInvHTML.apps=null;gTab='inv'}else{sfx('claim');toast(T('Selamat datang di guild!'));gTab='aula'}openGuild()},
 gUnapp:async gid=>{await api('/api/g/unapp',{tok:netTok(),gid:+gid});gInvHTML.apps=null;openGuild()},
 gOfferOk:async gid=>{gid=+gid;const of=(S.gOffer||[]).find(o=>o.gid===gid);const o=await gApi('join',{gid,by:of&&of.by});S.gOffer=(S.gOffer||[]).filter(o=>o.gid!==gid);save();if(!o||!o.ok){toast(gErr(o&&o.e,o),1);openGuild();return}sfx('claim');toast(o.st==='app'?T('Lamaran terkirim.'):T('Selamat datang di guild!'));gTab='aula';openGuild()},
 gOfferNo:gid=>{const of=(S.gOffer||[]).find(o=>o.gid===+gid);if(of)relBump(of.by,-1);S.gOffer=(S.gOffer||[]).filter(o=>o.gid!==+gid);save();openGuild()},
 gEmbSet:e=>{gEmbPick=+e;const n=$('#gmName')&&$('#gmName').value,t=$('#gmNote')&&$('#gmNote').value;$('#gdBody').innerHTML=gMakeHTML();if(n)$('#gmName').value=n;if(t)$('#gmNote').value=t},
 gModeSet:k=>{gNew.mode=+k;ACT.gEmbSet(gEmbPick)},
 gCreate:async()=>{const nm=gNameOk($('#gmName').value);if(!nm){toast(gErr('gname'),1);return}if(S.lv<G_CFG.minLv&&!(typeof gmOpt==='function'&&gmOpt('unl'))){toast(gErr('lv'),1);return}if(S.gems<G_CFG.create.gems){toast(T('Permata tidak cukup.'),1);return}
  if([...GS.G.values()].some(g=>g.name.toLowerCase()===nm.toLowerCase())){toast(gErr('gtaken'),1);return}
  const o=await gApi('create',{name:nm,emb:gEmbPick,mode:gNew.mode,minlv:G_CFG.minLv,note:($('#gmNote').value||'').trim()});if(!o||!o.ok){toast(gErr(o&&o.e,o),1);return}
  S.gems-=G_CFG.create.gems;save();sfx('rare');toast(T('Guild {n} berdiri!',{n:esc(nm)}));gTab='aula';openGuild()},
 gEditOpen:()=>{const me=gMine(),info=me&&GS.info[me.id];if(!me)return;const lead=gRoleOf(NET.acct.uid)===3,g=info&&info.g||me;gEmbPick=me.emb;
  modal(`<button class="btn red mclose" data-act="guild">‹</button><h3>${T('Pengaturan Guild')}</h3><div class="gmake"><label>${T('Pengumuman')}</label><input id="geNote" maxlength="120" value="${esc(g.note||'')}">
  ${lead?`<label>${T('Cara bergabung')}</label><div class="mtabs gsub">${G_MODE.map((m,k)=>`<button class="btn sm ${me.mode===k?'':'blue'}" data-act="gEditMode" data-arg="${k}">${T(m)}</button>`).join('')}</div>
  <label>${T('Level minimal')}</label><input id="geMin" type="number" min="1" max="200" value="${me.minlv}"><label>${T('Lambang')}</label><div class="gemr">${G_EMB_S.map((s,k)=>`<button class="ges${me.emb%10===k?' on':''}" data-act="gEditEmb" data-arg="${Math.floor(me.emb/10)*10+k}"><img class="px" src="${gEmb(Math.floor(me.emb/10)*10+k)}"></button>`).join('')}</div><div class="gemr">${G_EMB_C.map((c,k)=>`<button class="gec${Math.floor(me.emb/10)===k?' on':''}" style="background:${c[1]}" data-act="gEditEmb" data-arg="${k*10+me.emb%10}"></button>`).join('')}</div>`:''}
  <div class="mrow"><button class="btn green" data-act="gEditSave">${T('Simpan')}</button></div></div>`)},
 gEditMode:async k=>{await gApi('edit',{mode:+k});ACT.gEditOpen()},
 gEditEmb:async e=>{await gApi('edit',{emb:+e});ACT.gEditOpen()},
 gEditSave:async()=>{const me=gMine();const b={note:($('#geNote').value||'').trim()};if($('#geMin'))b.minlv=+$('#geMin').value||G_CFG.minLv;const o=await gApi('edit',b);if(!o||!o.ok){toast(gErr(o&&o.e),1);return}if(me)delete GS.infoAt[me.id];toast(T('Tersimpan'));gTab='aula';openGuild()},
 gApp:async a=>{const[uid,ok]=a.split(':');const o=await gApi('app',{uid,ok:ok==='1'});if(!o||!o.ok){toast(gErr(o&&o.e),1)}const me=gMine();if(me)await gInfo(me.id,true);openGuild()},
 gKick:uid=>{const x=gMemInfo({uid});confirmBox(T('Keluarkan {n} dari guild?',{n:esc(x.name)}),async()=>{const o=await gApi('kick',{uid});if(!o||!o.ok)toast(gErr(o&&o.e),1);const me=gMine();if(me)await gInfo(me.id,true);gTab='mem';openGuild()},T('Keluarkan'))},
 gMemAct:uid=>{const x=gMemInfo({uid}),r=gRoleOf(uid);modal(`<button class="btn red mclose" data-act="guild">‹</button><h3>${esc(x.name)} ${gRoleB(r)}</h3><div class="mcol">
  ${r!==2?`<button class="btn" data-act="gRole" data-arg="${uid}:2">${T('Angkat jadi Wakil Ketua')}</button>`:''}${r!==1?`<button class="btn blue" data-act="gRole" data-arg="${uid}:1">${T('Jadikan Elit')}</button>`:''}${r>0?`<button class="btn gray" data-act="gRole" data-arg="${uid}:0">${T('Jadikan Anggota biasa')}</button>`:''}
  <button class="btn" data-act="gLeadTo" data-arg="${uid}">👑 ${T('Serahkan jabatan Ketua')}</button><button class="btn red" data-act="gKick" data-arg="${uid}">${T('Keluarkan')}</button></div>`)},
 gRole:async a=>{const[uid,r]=a.split(':');const o=await gApi('role',{uid,role:+r});if(!o||!o.ok)toast(gErr(o&&o.e),1);else toast(T('Jabatan diubah'));gTab='mem';openGuild()},
 gLeadTo:uid=>{const x=gMemInfo({uid});confirmBox(T('Serahkan jabatan Ketua ke {n}?',{n:esc(x.name)}),async()=>{const o=await gApi('lead',{uid});if(!o||!o.ok)toast(gErr(o&&o.e),1);gTab='mem';openGuild()},T('Serahkan'))},
 gVoteAsk:()=>{const me=gMine();if(!me)return;const t=gMemInfo({uid:me.lead});confirmBox(T('Mulai mosi kudeta terhadap ketua {n}? Anggota punya 3 jam untuk memilih. Kalau gagal, kamu bisa dikeluarkan.',{n:esc(t.name)}),async()=>{const o=await gVoteStart('');if(!o||!o.ok){toast(gErr(o&&o.e),1);return}sfx('rare');toast(T('Mosi kudeta dimulai! Bujuk anggota agar mendukungmu.'));gTab='mem';await gInfo(me.id,true);openGuild()},T('Mulai'))},
 gVote:async y=>{const o=await gApi('vote',{op:'cast',y:y==='1'});if(!o||!o.ok){toast(gErr(o&&o.e),1);return}const me=gMine();if(me)await gInfo(me.id,true);toast(T('Suaramu masuk'));openGuild()},
 gSway:async uid=>{const me=gMine(),v=me&&gVoteOf(me.id),i=botIdxOf(uid);if(!v||i<0)return;const want=v.who===NET.acct.uid?true:v.tgt===NET.acct.uid?false:null;
  const choose=async y=>{const ok=Math.random()<gSwayP(i,v),p=botPres(i,Date.now()),ts=p.online?Date.now()+(20+Math.random()*90)*1e3:(gNextOn(i)||v.t1-1);
   const o=await gApi('vote',{op:'sway',uid,y:y?1:0,ok:ok?1:0,ts:Math.round(ts)});if(!o||!o.ok){toast(gErr(o&&o.e),1);return}
   toast(ok?(p.online?T('{n}: "oke deh, aku ikut kamu"',{n:botName(i)}):T('{n} akan memilih saat online.',{n:botName(i)})):T('{n} tidak mau berubah sikap.',{n:botName(i)}));relBump(uid,ok?2:-2);await gInfo(me.id,true);gTab='mem';openGuild()};
  if(want!=null){choose(want);return}
  modal(`<button class="btn red mclose" data-act="guild">‹</button><h3>${T('Bujuk {n}',{n:esc(botName(i))})}</h3><div class="mrow"><button class="btn green" data-act="gSwayY">${T('Dukung kudeta')}</button><button class="btn red" data-act="gSwayN">${T('Tolak kudeta')}</button></div>`);ACT.gSwayY=()=>choose(true);ACT.gSwayN=()=>choose(false)},
 gInvite:async i=>{i=+i;const me=gMine(),uid=botUid(i);if(!me||!uid)return;
  // teman bot + AI DM nyala → bujuk lewat obrolan; selain itu ajakan biasa (peluang)
  if(NET.aig&&typeof isFriend==='function'&&isFriend(uid)){modal(`<button class="btn red mclose" data-act="closeModal">✕</button><h3>${T('Ajak {n}',{n:esc(botName(i))})}</h3><p class="sub" style="text-align:center">${T('Bujuk lewat pesan pribadi (dia memutuskan dari obrolan kalian), atau kirim ajakan langsung.')}</p><div class="mcol"><button class="btn green" data-act="gInvDM" data-arg="${i}">💬 ${T('Bujuk lewat Pesan')}</button><button class="btn blue" data-act="gInvGo" data-arg="${i}">${T('Kirim Ajakan Langsung')}</button></div>`);return}
  ACT.gInvGo(i)},
 gInvGo:async i=>{i=+i;const o=await gInvite(i);if(!o||!o.ok){toast(gErr(o&&o.e),1);return}
  if(o.st==='wait')toast(T('Ajakan terkirim. {n} akan menjawab saat online.',{n:botName(i)}));else if(o.st==='in'){sfx('claim');toast(T('{n} menerima ajakanmu dan bergabung ke guild!',{n:botName(i)}))}else toast(T('{n} menolak ajakan guild-mu.',{n:botName(i)}));
  if($('#botBody'))openBot(i);else closeModal()},
 gInvDM:i=>{i=+i;const uid=botUid(i),me=gMine();S.gInvDM=Object.assign(S.gInvDM||{},{[uid]:Date.now()+30*6e4});save();openDM(uid);const f=$('#dmIn');if(f){f.value=T('eh mau gabung guild aku ga? {g}',{g:me?me.name:''});f.focus()}},
 gRecruit:()=>{closeModal();openRank()},
 rkGBy:k=>{gRankBy=k;sfx('tab');rankRefresh()},
});
// hasil DM dengan bot: setuju pindah ke guild-ku / ganti sikap di mosi
async function gDmResult(i,r){if(r.moved&&r.moved.ok){const uid=botUid(i);if(S.gInvDM)delete S.gInvDM[uid];save();setTimeout(async()=>{sfx('claim');toast(T('{n} setuju pindah ke guild-mu!',{n:botName(i)}));await gLoad(true)},Math.max(1500,(r.at||Date.now())-Date.now()))}
 if(r.voted){const me=gMine();if(me)setTimeout(()=>gInfo(me.id,true),Math.max(1500,(r.at||Date.now())-Date.now()))}}
// lencana tombol Guild di beranda
function gBadgeN(){if(!loggedIn()||!gReady())return 0;const me=gMine();let n=(me?0:(S.gOffer||[]).length);if(me){if(S.gci!==gToday())n++;if(gVoteOf(me.id))n++;if(NET.gcm>(S.gcSeen||0))n++}return n}
function gOnLoad(){if($('#gdBody')&&!document.activeElement?.matches('input'))guildRefresh();if(typeof homeRefresh==='function'&&typeof tab!=='undefined'&&tab==='home')try{homeRefresh()}catch(e){}}
