// ===== Rival abadi (angka: data/rival.js) =====
// S.rv = {i, gen, since, lead, cand, sc:{me,him}, gs, bs, next, cool:{i:t}, hist:[], boosts:[], chat:[], log:[[t,cp]], first}
// Rival dipilih dari bot yang lajunya mirip (alami). Usahanya (rvBoost) dibagikan lewat server sehingga semua pemain melihat angka yang sama.
function rvS(){if(!S.rv)S.rv={i:null,cool:{},hist:[],boosts:[],chat:[],log:[],sc:{me:0,him:0}};const R=S.rv;R.cool=R.cool||{};R.hist=R.hist||[];R.boosts=R.boosts||[];R.chat=R.chat||[];R.log=R.log||[];R.sc=R.sc||{me:0,him:0};return R}
// CP-ku untuk persaingan (fungsi biasa supaya bisa diganti saat pengujian)
function rvMe(){return teamPow()}
const rvOn=()=>S.rv&&S.rv.i!=null&&S.rv.gen===botsSig();
const rvIs=i=>rvOn()&&S.rv.i===i;
// ---- usaha ekstra (dipakai botKey di systems/bots.js) ----
// BOTS.rv: {bot:[[t0,t1,dp],...]} dari server; ditambah usaha lokal yang belum tercatat server
function rvEff(L,now){let e=0;for(const x of L){const t0=x[0],t1=x[1],dp=x[2];if(now<=t0)continue;e+=dp*Math.min(1,(now-t0)/Math.max(6e4,t1-t0))}return e}
function botBoost(i,now){const A=BOTS.rv&&BOTS.rv[i];let e=A?rvEff(A,now):0;
 if(S&&S.rv&&S.rv.boosts&&S.rv.gen===botsSig())for(const x of S.rv.boosts)if(x.i===i&&!(A&&A.some(y=>Math.abs(y[0]-x.t0)<1e3)))e+=rvEff([[x.t0,x.t1,x.dp]],now);return e}
// data server berubah: segarkan hanya bot yang usahanya berubah
function rvApply(rv){const old=BOTS.rv||{},nw=rv||{};BOTS.rv=nw;const ks=new Set([...Object.keys(old),...Object.keys(nw)]);
 for(const k of ks){if(JSON.stringify(old[k]||[])===JSON.stringify(nw[k]||[]))continue;const i=+k;delete BOTS.cache[i];if(typeof BSUMA!=='undefined')delete BSUMA[i];if(typeof BSUM!=='undefined'&&BSUM.d)delete BSUM.d[i]}}
// ---- catatan CP-ku (per jam, 8 hari) ----
function rvLog(now){const R=rvS(),L=R.log,cp=rvMe();if(!L.length||now-L[L.length-1][0]>=36e5)L.push([now,cp]);else if(cp>L[L.length-1][1])L[L.length-1][1]=cp;
 while(L.length>200||(L.length&&now-L[0][0]>8*864e5))L.shift()}
function rvMyRate(now){const L=rvS().log,C=RIVAL_CFG;const old=L.find(x=>now-x[0]<=C.rateWin*1.25&&now-x[0]>=C.rateWin*.5);if(!old||!old[1])return null;return rvMe()/old[1]}
// ---- memilih rival ----
function rvPick(now){const C=RIVAL_CFG,R=rvS(),me=rvMe();if(!me)return null;const myR=rvMyRate(now);
 const L=botsList().filter(e=>typeof e.i==='number'&&!e.me&&!botHidden(e.i));
 const ok=(e,band)=>{if(e.cp<me*band[0]||e.cp>me*band[1])return false;if(R.cool[e.i]&&R.cool[e.i]>now)return false;if(!(e.online||now-e.last<=C.activeWithin))return false;
  const b=botBase(e.i);return b.endT>now+C.stayDays*864e5&&now-b.join>C.minAge};
 let pool=L.filter(e=>ok(e,C.band));if(pool.length<3)pool=L.filter(e=>ok(e,C.wide));if(!pool.length)return null;
 pool.sort((a,b)=>Math.abs(Math.log(a.cp/me))-Math.abs(Math.log(b.cp/me)));pool=pool.slice(0,C.maxCand);
 const seed=+(S.uid||7)%1000003;let best=null,bs=1e9;
 for(const e of pool){let sc=Math.abs(Math.log(e.cp/me))+(e.cp<me?.04:0)+(bHash(seed,e.i+31*wibDay(now))%1000)/1000*.08;
  if(myR){const past=botSum(e.i,now-C.rateWin,true).cp||e.cp,br=e.cp/Math.max(1,past);sc+=1.5*Math.abs(Math.log(br/myR))}
  if(sc<bs){bs=sc;best=e}}
 return best}
// ---- usaha ekstra saat disalip: sesi main berikutnya ----
function rvPlanBoost(i,now){const C=RIVAL_CFG.boost,R=rvS(),b=botBase(i);if(R.boosts.some(x=>x.i===i&&now-x.at<C.gap))return null;
 const pr=botPresence(i,now);let t0=null,t1=null;
 if(pr.online){const d=wibDay(now);for(const[s0,s1]of botSessions(b,d))if(s0<=now&&s1>now+12*6e4){t0=now+C.lead;t1=s1}}
 for(let d=wibDay(now);t0==null&&d<=wibDay(now)+2;d++)for(const[s0,s1]of botSessions(b,d))if(s0>=now+C.lead&&s0<now+30*36e5){t0=s0;t1=Math.max(s1,s0+20*6e4);break}
 if(t0==null)return null;t1=Math.min(t1,t0+3*36e5);
 const dp=Math.min(C.max,(C.tier[b.tier.id]||.2)*(C.sk[b.sk]||1)*(.85+(bHash(i,now/36e5|0)%300)/1000));
 const x={i,t0:Math.round(t0),t1:Math.round(t1),dp:+dp.toFixed(3),at:now,sent:0};R.boosts.push(x);while(R.boosts.length>30)R.boosts.shift();return x}
async function rvSendBoosts(){if(!loggedIn())return;const R=rvS();for(const x of R.boosts){if(x.sent)continue;x.sent=1;
 const w=bW(x.i);if(!w){x.sent=1;continue}const o=await api('/api/rv/boost',{tok:netTok(),gen:w.g,bot:bLi(x.i),t0:x.t0,t1:x.t1,dp:x.dp});if(!o.ok&&(o.e==='net'||o.e==='server'))x.sent=0;else if(!o.ok)x.rej=o.e;save()}}
// ---- momen untuk Obrolan Dunia ----
function rvChat(ev,i,now){const C=RIVAL_CFG,R=rvS();if(bRng(bHash(i,now/6e4|0))()>(C.chat[ev]||0))return;R.chat.push({ev,i,k:ev+':'+i+':'+(now/6e4|0),t:now});while(R.chat.length>6)R.chat.shift()}
// dipanggil wcAiBody: momen yang si rivalnya sedang online
function rvChatPending(now,on){const R=S.rv;if(!R||!R.chat||!R.chat.length)return null;R.chat=R.chat.filter(x=>now-x.t<RIVAL_CFG.chatTtl);return R.chat.find(x=>on.includes(x.i)&&botUid(x.i))||null}
function rvChatDone(k){const R=S.rv;if(R&&R.chat){R.chat=R.chat.filter(x=>x.k!==k);save()}}
// ---- akhir masa rival ----
function rvEnd(why,now){const R=rvS(),i=R.i,C=RIVAL_CFG;if(i==null)return;
 R.hist.unshift({i,name:botName(i),since:R.since,until:now,why,me:R.sc.me,him:R.sc.him,gen:R.gen});R.hist=R.hist.slice(0,C.hist);
 R.cool[i]=now+C.cool;for(const k in R.cool)if(R.cool[k]<now)delete R.cool[k];
 const nm=botName(i);R.i=null;R.cand=null;R.gs=R.bs=null;R.next=now+(C.nextGap[0]+Math.random()*(C.nextGap[1]-C.nextGap[0]))*36e5;
 if(why==='giveup'){rvChat('giveup',i,now);toast('⚔ '+T('{n} menyerah mengejarmu. Kamu menang!',{n:nm}))}
 else if(why==='bored'){rvChat('bored',i,now);toast('⚔ '+T('{n} sudah melesat jauh dan berhenti melirikmu.',{n:nm}))}
 else if(why==='gone')toast('⚔ '+T('Rivalmu {n} sudah lama tidak bermain.',{n:nm}));
 save();BOTS.onChange&&BOTS.onChange()}
// ---- detak utama (tiap 20 detik) ----
function rvTick(now=Date.now()){if(!S||!S.welcomed||!BOTS.warmAt||!BOTS.ready||!BOTS.W||!BOTS.W.length)return;const C=RIVAL_CFG,R=rvS();
 rvLog(now);
 if(R.gen!==botsSig()){if(R.i!=null)R.hist=[];R.i=null;R.gen=botsSig();R.boosts=[];R.chat=[];R.cool={};R.next=0}   // dunia bot di-reset / server digabung
 if(S.lv<C.minLv)return;if(!R.first){R.first=now;save();return}if(now-R.first<C.firstAfter)return;
 if(R.i==null){if(now<(R.next||0))return;const e=rvPick(now);if(!e){R.next=now+36e5;return}
  R.i=e.i;R.since=now;R.sc={me:0,him:0};R.lead=rvMe()>=e.cp?'me':'him';R.cand=null;R.gs=R.bs=null;rvChat('new',e.i,now);
  toast('⚔ '+T('Rival baru: {n} mulai mengejarmu di peringkat!',{n:botName(e.i)}));save();BOTS.onChange&&BOTS.onChange();return}
 const i=R.i;if(!botIn(i,now)||botHidden(i)){rvEnd('gone',now);return}
 const b=botBase(i),pr=botPresence(i,now);if(b.endT<now||now-pr.last>C.gone){rvEnd('gone',now);return}
 const me=rvMe(),his=botSum(i,now,true).cp;if(!me||!his)return;
 // salip-menyalip dengan jeda (ganti tim sebentar tidak dihitung)
 const side=me>his*(1+C.flip.eps)?'me':his>me*(1+C.flip.eps)?'him':R.lead;
 if(side!==R.lead){if(!R.cand||R.cand.side!==side)R.cand={side,t:now};else if(now-R.cand.t>=C.flip.hold){R.lead=side;R.cand=null;
   if(side==='me'){R.sc.me++;rvChat('passed',i,now);rvPlanBoost(i,now);toast('⚔ '+T('Kamu menyalip rivalmu {n}!',{n:botName(i)}))}
   else{R.sc.him++;rvChat('back',i,now);toast('⚔ '+T('{n} menyalipmu lagi!',{n:botName(i)}))}save();BOTS.onChange&&BOTS.onChange()}}else R.cand=null;
 // menyerah / bosan setelah selisih jauh bertahan lama
 if(now-R.since>=C.tenure){
  if(me>=his*C.giveup.ratio){R.gs=R.gs||now;if(now-R.gs>=C.giveup.hold){rvEnd('giveup',now);return}}else R.gs=null;
  if(his>=me*C.bored.ratio){R.bs=R.bs||now;if(now-R.bs>=C.bored.hold){rvEnd('bored',now);return}}else R.bs=null}
 if(R.boosts.some(x=>!x.sent))rvSendBoosts()}
// ---- Arena: rival menyerang Tim Bertahan sekali di sesi pertamanya tiap hari ----
function rvArenaEvents(from,now){const out=[];if(!RIVAL_CFG.arena||!rvOn())return out;const i=S.rv.i,b=botBase(i);
 for(let d=wibDay(from);d<=wibDay(now);d++){const ss=botSessions(b,d);if(!ss.length)continue;const[s0,s1]=ss[0],t=Math.round(s0+(bHash(i,d*13+5)%1000)/1000*(s1-s0)*.7);
  if(t>from&&t<=now&&t>=S.rv.since)out.push([t,0,i])}return out}
// ---- teks untuk tampilan ----
function rvWhy(w){return{giveup:T('menyerah'),bored:T('melesat jauh'),gone:T('berhenti main')}[w]||w}
function rvBarHTML(){if(!rvOn())return'';const R=S.rv,i=R.i,now=Date.now(),s=botSum(i,now),me=rvMe(),d=s.cp-me,pr=botPresence(i,now),days=Math.floor((now-R.since)/864e5)+1;
 return`<button class="rvbar" data-act="botView" data-arg="${i}"><span class="rvic">⚔</span><span class="rvnm"><small>${T('Rivalmu')} · ${T('hari ke-{n}',{n:days})} · ${T('Salip')} ${R.sc.me}–${R.sc.him}</small><b>${esc(botName(i))}</b><small>${pr.online?`<em class="ok">${T('Online')}</em>`:T('Aktif {t}',{t:agoMs(now-pr.last)})}</small></span>
  <span class="rvgap ${d>0?'dn':'up'}"><b>${d>0?'+':'−'}${fmt(Math.abs(d))}</b><small>${d>0?T('di depanmu'):T('di belakangmu')}</small></span></button>`}
function rvProfHTML(i){const R=S.rv;if(!R)return'';const now=Date.now();
 if(rvIs(i))return`<div class="rvprof">⚔ ${T('Rivalmu sejak {t}',{t:agoMs(now-R.since)})} · ${T('saling salip: kamu {a}, dia {b}',{a:R.sc.me,b:R.sc.him})}</div>`;
 const h=(R.hist||[]).find(x=>x.i===i&&x.gen===botsSig());return h?`<div class="rvprof old">${T('Mantan rival')} · ${rvWhy(h.why)} · ${T('saling salip: kamu {a}, dia {b}',{a:h.me,b:h.him})}</div>`:''}
setTimeout(()=>{setInterval(()=>{try{rvTick()}catch(e){console.error(e)}},2e4)},15e3);
