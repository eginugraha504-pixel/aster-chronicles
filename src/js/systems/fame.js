/* =====================================================================
   KETENARAN — para bot sadar papan peringkat CP server: siapa yang kuat, timnya, guildnya, dan siapa
   yang baru masuk top 20 / 10 / 3 / #1. Saat KAMU masuk tingkat itu, pelan-pelan (saat si bot online,
   tidak sekaligus, ada batas harian) muncul pesan dari bot yang bukan temanmu:
   - rekrut  : ketua / wakil guild lain yang lebih kuat mengajak bergabung (undangan masuk tab Undangan)
   - fans    : pemain biasa menyapa, kagum, minta tips ("suhu", "sepuh")
   - rival   : yang peringkatnya berdekatan menantang santai
   - ucapan  : teman / rekan guild memberi selamat
   Setelah itu tetap ada sesekali selama kamu bertahan di tingkat itu (makin tinggi makin sering).
   Pesan ditulis server (Claude bila AI DM + Guild nyala, selain itu kalimat biasa) — lihat dmFame di worker.
   Para bot juga tahu 5 besar CP server (nama, CP, tim, guild) lewat konteks Obrolan Dunia (fameWorldTxt).
   ===================================================================== */
const FAME={burst:[0,1,2,2,3],perDay:[0,.35,.7,1.2,2],max:[0,2,3,4,6],lab:['','top 20','top 10','top 3','peringkat #1 CP']};
const fameTier=r=>!r?0:r<=1?4:r<=3?3:r<=10?2:r<=20?1:0;
function fameList(now=Date.now()){return botsList(now).sort((a,b)=>b.cp-a.cp)}
// 5 besar CP server (untuk konteks AI Obrolan Dunia)
function fameTop(n=5,now=Date.now()){return fameList(now).slice(0,n).map((e,k)=>{const i=typeof e.i==='number'?e.i:null,uid=i!=null?botUid(i):e.me?(loggedIn()?NET.acct.uid:null):e.h;
 const team=i!=null?botState(i,now).team:e.me?S.team.filter(Boolean):[e.top].filter(Boolean),g=typeof gReady==='function'&&gReady()&&uid?gOfUid(uid):null;
 return{rk:k+1,name:e.me?S.name:e.name,cp:e.cp,i,me:!!e.me,team:team.filter(id=>HD[id]).map(id=>HD[id].name),g:g&&g.name}})}
function fameWorldTxt(now=Date.now()){try{const T5=fameTop(5,now),G=typeof gReady==='function'&&gReady()?gRankList('cp').slice(0,3).map(g=>g.name):[];
 return`peringkat CP server: ${T5.map(x=>`#${x.rk} ${x.name}${x.me?' (PEMAIN)':''} CP ${fmt(x.cp)}${x.team.length?' tim '+x.team.join('/'):''}${x.g?', guild '+x.g:''}`).join('; ')}${G.length?'; guild terkuat: '+G.join(', '):''}`}catch(e){return''}}
const fameCD=3*BDAY;
// pilih bot pengirim sesuai jenis
function fameSender(x,r,now){const R=Math.random,me=typeof gMine==='function'?gMine():null,myCp=teamPow();
 if(x==='rekrut'){if(typeof gReady!=='function'||!gReady())return null;const P=gPowAll(),myRk=me?P.get(me.id).rk:999;
  const L=[...GS.G.values()].filter(g=>(!me||g.id!==me.id)&&g.M.length<g.cap&&S.lv>=g.minlv&&P.get(g.id).rk<Math.max(6,myRk)).sort((a,b)=>P.get(a.id).rk-P.get(b.id).rk).slice(0,12);
  for(const g of L.sort(()=>R()-.5)){const off=g.M.filter(m=>m.role>=2).map(m=>botIdxOf(m.uid)).filter(i=>i>=0&&botIn(i,now)&&!botFrozen(i,now));if(off.length)return off.sort((a,b)=>botPres(b,now).online-botPres(a,now).online)[0]}return null}
 const L=fameList(now),bots=L.filter(e=>typeof e.i==='number');
 if(x==='rival'){const k=L.findIndex(e=>e.me),near=L.slice(Math.max(0,k-6),k+7).filter(e=>typeof e.i==='number'&&(gTrait(e.i).amb>.5||/kompetitif/.test(wcPersona(e.i).sifat)));return near.length?near[Math.floor(R()*near.length)].i:null}
 if(x==='ucapan'){const F=(NET.friends.friends||[]).filter(f=>f.bot!=null&&botIn(f.bot,now)).map(f=>f.bot),G=me?me.M.map(m=>botIdxOf(m.uid)).filter(i=>i>=0&&botIn(i,now)):[];
  const L2=[...new Set(F.concat(G))].filter(i=>typeof relEff!=='function'||relEff(botUid(i))>=5||F.includes(i));return L2.length?L2[Math.floor(R()*L2.length)]:null}
 // fans: pemain biasa yang jauh di bawah peringkatku, cukup ramah
 const mk=Math.max(0,L.findIndex(e=>e.me)),low=L.slice(mk+30).filter(e=>typeof e.i==='number');
 for(let k=0;k<60&&low.length;k++){const e=low[Math.floor(R()*low.length)];if(!e||e.lv<6)continue;const i=e.i;if(gTrait(i).soc<.4||(me&&gBotGuild(i)&&gBotGuild(i).id===me.id))continue;if(!botFrozen(i,now))return i}return null}
function fameSchedule(t,r,now,k=0){const F=S.fame;if(F.q.length>=6)return;const me=typeof gMine==='function'?gMine():null,R=Math.random;
 const P=typeof gReady==='function'&&gReady()?gPowAll():null,myRk=me&&P?P.get(me.id).rk:99;
 const W=[['rekrut',P?(myRk<=2?.4:myRk<=5?1.5:3.2):0],['fans',2.2],['rival',t>=2?1.5:.5],['ucapan',((NET.friends.friends||[]).some(f=>f.bot!=null)||me)?(k===0?2:.8):0]];
 if(k===0&&t>=2)W[0][1]*=1.4;let type='fans',i=null;
 for(let tr=0;tr<4&&i==null;tr++){let x=R()*W.reduce((a,w)=>a+w[1],0);type='fans';for(const w of W){if(x<w[1]){type=w[0];break}x-=w[1]}i=fameSender(type,r,now);if(i==null)W.find(w=>w[0]===type)[1]=0}
 if(i==null)return;const uid=botUid(i);if(!uid||(F.cd[uid]&&now-F.cd[uid]<fameCD)||F.q.some(q=>q.uid===uid))return;
 const on=botPres(i,now).online,at=on?now+(60+R()*(k?50:20)*60)*1e3:(typeof gNextOn==='function'?gNextOn(i,now):null);if(!at||at-now>BDAY)return;
 F.q.push({uid,i,x:type,at:Math.round(at),r,t,gid:type==='rekrut'&&gBotGuild(i)?gBotGuild(i).id:null});save()}
function fameWhy(q,i){const me=typeof gMine==='function'?gMine():null,nm=NET.acct.u,lab=FAME.lab[q.t]||'',now=Date.now();
 if(q.x==='rekrut'){const g=GS.G.get(q.gid),P=gPowAll(),m=GS.mem.get(botUid(i));return`${nm} sekarang peringkat CP #${q.r} di server (${lab}). Kamu ${G_ROLE[m?m.role:0]} guild ${g.name} (peringkat guild #${P.get(g.id).rk}, ${g.M.length}/${g.cap} anggota)${me?` sementara ${nm} di guild ${me.name} (peringkat #${P.get(me.id).rk})`:` dan ${nm} belum punya guild`}. Kamu ingin merekrutnya; undangan guild SUDAH kamu kirim (muncul di tab Undangan guild-nya).`}
 if(q.x==='rival'){const k=fameList(now).findIndex(e=>e.i===i)+1;return`Kalian bersaing di papan CP: ${nm} #${q.r}, kamu #${k}. Kamu kompetitif; sapa dengan nada menantang tapi santai & sportif.`}
 if(q.x==='ucapan')return`${nm} baru saja masuk ${lab} CP server (#${q.r}). Kamu ${isFriend(botUid(i))?'temannya':'satu guild dengannya'}; beri selamat singkat dengan gayamu.`;
 return`${nm} pemain terkenal di server: peringkat CP #${q.r} (${lab}), CP ${fmt(teamPow())}. Kamu (CP ${fmt(botSum(i).cp)}) penasaran / kagum; menyapa, memuji, atau tanya tips (tim, hero, cara farming). Kalian belum kenal.`}
let FAME_BUSY=false;
async function fameRun(now){const F=S.fame;if(FAME_BUSY)return;FAME_BUSY=true;
 try{for(const q of F.q.slice()){if(q.at>now)continue;F.q=F.q.filter(y=>y!==q);const i=botIdxOf(q.uid);if(i<0||!botIn(i,now)||F.n>=FAME.max[F.cur||q.t]){save();continue}
  if(q.x==='rekrut'&&(!GS.G.has(q.gid)||(gMine()&&gMine().id===q.gid))){save();continue}
  const D=wcDesc(i,now),ctx=typeof gDmCtx==='function'?gDmCtx(i):{};
  const o=await api('/api/dm/bot',{tok:netTok(),uid:q.uid,kind:'fame',x:q.x,at:Math.min(now,q.at),why:fameWhy(q,i),v:{g:q.gid&&GS.G.get(q.gid)?GS.G.get(q.gid).name:'',r:q.r,k:FAME.lab[q.t]},g:ctx,
   cand:{pub:D.pub,priv:D.priv,style:wcStyle(i),lower:wcPersona(i).lower},player:{name:NET.acct.u,pub:wcMePub()},rel:typeof dmBotRel==='function'?dmBotRel(i):'',fr:(q.x==='fans'&&Math.random()<.35)||(q.x==='rekrut'&&Math.random()<.5)||(q.x==='rival'&&Math.random()<.3)?1:0});
  if(o&&o.ok&&o.n){F.n++;F.cd[q.uid]=now;if(q.x==='rekrut'&&q.gid){S.gOffer=(S.gOffer||[]).filter(x=>x.gid!==q.gid).concat([{gid:q.gid,by:q.uid,t:now,why:'rekrut'}]).slice(-6)}save();setTimeout(()=>{try{netPing()}catch(e){}},Math.max(2e3,(o.at||now)-now+1500))}else save()}}
 catch(e){console.warn('fame',e)}finally{FAME_BUSY=false}}
function fameTick(){if(!loggedIn()||NET.acct.watch||!botsWarmOk()||document.hidden)return;const L=document.getElementById('login');if(L&&L.classList.contains('on'))return;
 const now=Date.now(),F=S.fame=S.fame||{cur:0,q:[],d:0,n:0,cd:{}};F.q=F.q||[];F.cd=F.cd||{};const day=wibDay(now);if(F.d!==day){F.d=day;F.n=0}
 for(const u in F.cd)if(now-F.cd[u]>fameCD)delete F.cd[u];
 const r=chMyRank(),t=fameTier(r);F.rk=r;
 if(t>F.cur){for(let k=0;k<FAME.burst[t];k++)fameSchedule(t,r,now,k);F.cur=t;F.up=now;save()}
 else if(t<F.cur){F.cur=t;save()}
 else if(t&&Math.random()<FAME.perDay[t]*9e4/BDAY)fameSchedule(t,r,now,1);
 fameRun(now)}
setInterval(fameTick,9e4);
