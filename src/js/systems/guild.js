/* =====================================================================
   GUILD — keadaan (dari server), sifat politik bot, relasi tersembunyi, simulasi politik bot (tick),
   bujukan, mosi kudeta, undangan dari bot, kalimat obrolan guild para bot.
   - Server (bank-worker/src/guild.js) = buku besar: siapa di guild mana, ketua, xp, catatan, mosi.
   - Game = "otak" bot: tiap 20 menit pemain online pertama menghitung keputusan semua bot (berdiri,
     bergabung, pindah, ikut teman, memisahkan diri, ganti ketua, mosi kudeta, bubar, absen & donasi)
     lalu mengirimnya sebagai ops (gSim → /api/g/tick).
   - Relasi bot↔bot (afinitas) dihitung dari sifat & jadwal main (tidak disimpan); relasi pemain↔bot
     disimpan server (tabel rel) dan naik-turun karena ngobrol, se-guild, dibujuk, Arena, dll.
   ===================================================================== */
const GS={srv:0,gv:-1,t:0,at:0,G:new Map(),mem:new Map(),V:[],R:{},tk:0,busy:false,pr:null,ver:0,
 rel:new Map(),relAt:0,relQ:[],relT:0,tickBusy:false,pw:null,pwKey:'',info:{},infoAt:{},chat:[],chatAt:0,chatGid:0};
const E0G=Date.UTC(2026,10,1);

/* ---------- keadaan dari server ---------- */
async function gLoad(force){const srv=netSrv();if(GS.busy)return GS.pr;
 if(!force&&GS.srv===srv&&(NET.gv==null||NET.gv===GS.gv)&&Date.now()-GS.at<5*6e4)return;
 GS.busy=true;GS.pr=(async()=>{try{const o=await api('/api/g/all?srv='+srv);if(!o||!o.ok)return;
  const G=new Map(),mem=new Map();
  for(const r of o.G){const g={id:r[0],name:r[1],lead:r[2],xp:r[3],emb:r[4],mode:r[5],minlv:r[6],made:r[7],fdr:r[8],M:[]};g.lv=gLvOf(g.xp);g.cap=G_CFG.cap(g.lv);G.set(g.id,g)}
  for(const gid in o.M){const g=G.get(+gid);if(!g)continue;for(const e of String(o.M[gid]).split(',')){if(!e)continue;const[u,ro,j]=e.split(':');const m={uid:u,gid:g.id,role:+ro,joined:E0G+parseInt(j,36)*6e4};g.M.push(m);mem.set(u,m)}}
  GS.G=G;GS.mem=mem;GS.V=o.V||[];GS.R=o.R||{};GS.tk=Math.max(GS.srv===o.srv?GS.tk:0,o.tk||0);GS.gv=o.gv;GS.srv=o.srv;GS.t=o.t;GS.at=Date.now();GS.ver++;GS.pw=null;
  if(typeof gOnLoad==='function')gOnLoad()}catch(e){console.warn('gLoad',e)}finally{GS.busy=false}})();return GS.pr}
const gReady=()=>GS.srv===netSrv()&&GS.at>0;
const gOfUid=uid=>{const m=GS.mem.get(String(uid));return m?GS.G.get(m.gid)||null:null};
const gMine=()=>loggedIn()&&gReady()?gOfUid(NET.acct.uid):null;
const gRoleOf=uid=>{const m=GS.mem.get(String(uid));return m?m.role:-1};
const gBotGuild=i=>{const u=botUid(i);return u?gOfUid(u):null};
const gVoteOf=gid=>{const v=GS.V.find(x=>x[1]===gid);return v?{id:v[0],gid:v[1],who:v[2],tgt:v[3],t0:v[4],t1:v[5]}:null};
// data anggota untuk tampilan & simulasi: bot (botSum/botPres), aku, pemain asli lain (NET.players)
function gMemInfo(m,now=Date.now()){const i=botIdxOf(m.uid);
 if(i>=0&&botIn(i,now)){const s=botSum(i,now),p=botPres(i,now);return{i,cp:s.cp,lv:s.lv,top:s.top,vip:s.vip,online:p.online,last:p.last,name:botName(i),bot:true}}
 if(loggedIn()&&m.uid===NET.acct.uid)return{cp:teamPow(),lv:S.lv,top:S.team.find(Boolean),vip:vipOf(S.iap&&S.iap.spent||0),online:true,last:now,name:S.name,me:true};
 const p=(NET.players||[]).find(x=>x.uid===m.uid);if(p)return{cp:p.cp||0,lv:p.lv||1,top:p.top,vip:p.vip||0,online:!!p.on,last:p.last||now,name:p.u,real:true};
 const c=GS.cards&&GS.cards[m.uid];if(c)return{cp:c.cp||0,lv:c.lv||1,top:c.top,vip:c.vip||0,online:!!c.on,last:c.last||now,name:c.u,real:true};
 return{cp:0,lv:1,online:false,last:now,name:'?',real:true,unk:true}}
// total CP, anggota aktif & peringkat semua guild (dihitung ulang tiap 30 dtk)
function gPowAll(now=Date.now()){const key=GS.ver+':'+(typeof botsSig==='function'?botsSig():'')+':'+Math.floor(now/3e4)+':'+(NET.players||[]).length;if(GS.pw&&GS.pwKey===key)return GS.pw;
 const P=new Map();for(const g of GS.G.values()){let cp=0,act=0,on=0;for(const m of g.M){const x=gMemInfo(m,now);cp+=x.cp;if(now-x.last<2*BDAY)act++;if(x.online)on++}P.set(g.id,{cp,act,on,n:g.M.length})}
 [...GS.G.values()].sort((a,b)=>P.get(b.id).cp-P.get(a.id).cp).forEach((g,k)=>P.get(g.id).rk=k+1);
 [...GS.G.values()].sort((a,b)=>b.xp-a.xp||P.get(b.id).cp-P.get(a.id).cp).forEach((g,k)=>P.get(g.id).rkLv=k+1);
 GS.pw=P;GS.pwKey=key;return P}
const gPow=g=>gPowAll().get(g.id)||{cp:0,act:0,on:0,n:0,rk:0,rkLv:0};

/* ---------- sifat politik bot (tetap per bot) & afinitas bot↔bot ---------- */
const GTR={};
function gTrait(i){if(GTR[i])return GTR[i];const r=bRng(bHash(i,9301)),P=wcPersona(i),b=botBase(i);
 let amb=r(),loy=r(),soc=r(),tegas=r();const lone=r()<G_CFG.sim.lone;
 if(/kompetitif/.test(P.sifat))amb=Math.min(1,amb+.3);if(/cuek/.test(P.sifat))soc*=.6;if(/suka bantu|sabar/.test(P.sifat))loy=Math.min(1,loy+.25);if(/kocak|sering cerita/.test(P.sifat))soc=Math.min(1,soc+.2);
 if(b.tier&&/whale/.test(b.tier.id))amb=Math.min(1,amb+.15);
 return GTR[i]={amb,loy,soc,tegas,lone}}
// kecocokan dua bot (≈ -0.7..1.5): kimia acak + sifat & kesibukan sehari-hari yang mirip + jam main yang mirip
function gAff(i,j){if(i===j)return 2;const a=Math.min(i,j),b=Math.max(i,j),h=bRng(bHash(a*7919+b*31,9311))(),P=wcPersona(i),Q=wcPersona(j),A=botBase(i),B=botBase(j);
 let v=(h-.5)*1.4;if(P.sifat===Q.sifat)v+=.25;if(P.hidup===Q.hidup)v+=.3;if(P.call===Q.call)v+=.05;v+=.25*(1-Math.min(1,Math.abs((A.chrono||0)-(B.chrono||0))/3));return v}
// teman akrab bot di guildnya (tersembunyi; dipakai AI obrolan & keputusan ikut pindah)
function gBestFriends(i,n=2){const g=gBotGuild(i);if(!g)return[];const now=Date.now(),mi=GS.mem.get(botUid(i));
 return g.M.map(m=>({m,j:botIdxOf(m.uid)})).filter(x=>x.j>=0&&x.j!==i&&botIn(x.j,now)).map(x=>({j:x.j,v:gAff(i,x.j)+Math.min(.4,(now-Math.max(x.m.joined,mi?mi.joined:now))/BDAY*.06)})).filter(x=>x.v>.85).sort((a,b)=>b.v-a.v).slice(0,n)}

/* ---------- relasi tersembunyi aku ↔ bot ---------- */
async function relLoad(force){if(!loggedIn()||NET.acct.watch)return;if(!force&&Date.now()-GS.relAt<5*6e4)return;GS.relAt=Date.now();
 const o=await api('/api/rel/mine',{tok:netTok()});if(o&&o.ok)GS.rel=new Map(o.list.map(r=>[r[0],{v:r[1],n:r[2],ts:r[3]}]))}
// relasi efektif: tersimpan + lama se-guild + berteman
function relEff(uid,now=Date.now()){uid=String(uid);const r=GS.rel.get(uid);let x=r?r.v:0;const me=gMine(),m=GS.mem.get(uid);
 if(me&&m&&m.gid===me.id){const mm=GS.mem.get(NET.acct.uid),d=(now-Math.max(m.joined,mm?mm.joined:now))/BDAY;x+=Math.min(15,Math.max(0,d)*2.5)}
 if(typeof isFriend==='function'&&isFriend(uid))x+=6;return Math.max(-100,Math.min(100,Math.round(x)))}
const relTier=v=>v<=-40?'tidak suka':v<=-10?'kurang suka':v<15?'biasa saja':v<40?'teman':v<70?'akrab':'sahabat dekat';
function relBump(uid,d){if(!loggedIn()||NET.acct.watch||!d)return;uid=String(uid);const r=GS.rel.get(uid)||{v:0,n:0,ts:0};r.v=Math.max(-100,Math.min(100,r.v+d));r.ts=Date.now();GS.rel.set(uid,r);
 GS.relQ.push([uid,d]);clearTimeout(GS.relT);GS.relT=setTimeout(()=>{const L=GS.relQ.splice(0,20);if(L.length)api('/api/rel/bump',{tok:netTok(),list:L})},1500)}
// relasi pemain asli lain (ketua) dengan bot: dari server (R) — tanpa data = netral
const relOf=(real,bot)=>loggedIn()&&real===NET.acct.uid?relEff(bot):((GS.R[real]||{})[bot]||0);

/* ---------- mosi kudeta: sikap tiap anggota bot (dihitung saat mosi dimulai; bisa berubah karena dibujuk) ---------- */
function gVoteTs(i,now,t1){const p=botPres(i,now);if(p.online)return now+(30+bHash(i,now/6e4|0)%370)*1e3;const b=botBase(i);
 for(let d=wibDay(now);d<=wibDay(t1);d++)for(const[s0,s1]of botSessions(b,d)){if(s1<now||s0>=t1)continue;const ts=Math.max(now,s0)+(60+bHash(i,d*7+3)%540)*1e3;if(ts<t1)return ts}return null}
function gStanceScore(i,who,tgt,now,gid){const wb=botIdxOf(who),tb=botIdxOf(tgt),tr=gTrait(i);
 const aw=wb>=0?gAff(i,wb)*.8:relOf(who,botUid(i))/60,at=tb>=0?gAff(i,tb)*.8:relOf(tgt,botUid(i))/60;
 const off=(now-gMemInfo({uid:tgt},now).last)/BDAY;
 return aw-at+Math.min(1.2,off*.3)+(tr.amb-.5)*.3-tr.loy*.25+(bRng(bHash(i,gid*31+(now/36e5|0)))()-.5)*.6-.05}
function gStances(g,who,tgt,now=Date.now()){const out={},t1=now+G_CFG.vote.ms;
 for(const m of g.M){if(m.uid===who||m.uid===tgt)continue;const i=botIdxOf(m.uid);if(i<0||!botIn(i,now)||botFrozen(i,now)||now-botPres(i,now).last>2*BDAY)continue;
  const ts=gVoteTs(i,now,t1);if(ts==null)continue;out[m.uid]=[gStanceScore(i,who,tgt,now,g.id)>0?1:0,Math.round(ts)]}
 return out}
// akibat mosi (dihitung saat dimulai): berhasil → pendukung setia ketua lama ikut keluar; gagal → ketua tegas mengeluarkan si penggagas (+ teman akrabnya)
function gVoteRes(g,who,tgt,now=Date.now()){const tb=botIdxOf(tgt),wb=botIdxOf(who),yes={leave:[]},no={kick:false,leave:[]};
 if(tb>=0){for(const m of g.M){const i=botIdxOf(m.uid);if(i<0||i===tb||m.uid===who)continue;if(gAff(i,tb)>1.05&&gTrait(i).loy>.6)yes.leave.push(m.uid)}yes.leave=yes.leave.slice(0,4);
  no.kick=gTrait(tb).tegas>.45;if(no.kick&&wb>=0)for(const m of g.M){const i=botIdxOf(m.uid);if(i<0||i===wb||m.uid===tgt)continue;if(gAff(i,wb)>1.15)no.leave.push(m.uid)}no.leave=no.leave.slice(0,3)}
 return{yes,no}}

/* ---------- simulasi politik bot: satu tick (20 menit) ---------- */
function gSim(now,k){
 const C=G_CFG,SIM=C.sim,ops=[],srv=netSrv(),launch=!GS.tk,t0=launch?now-C.tick:Math.max(GS.tk*C.tick,now-3*BDAY),span=Math.max(6e4,now-t0),gapD=Math.max(C.tick,span)/BDAY;
 const hz=pd=>1-Math.pow(1-Math.min(.99,Math.max(0,pd)),gapD),R=bRng((k*7919+srv*131)>>>0),at=()=>Math.round(t0+R()*span);
 // populasi bot
 const B=new Map();
 for(const i of botsIds(now)){const uid=botUid(i);if(!uid||(typeof botHidden==='function'&&botHidden(i)))continue;const s=botSum(i,now),p=botPres(i,now),fz=botFrozen(i,now);
  B.set(uid,{i,uid,cp:s.cp,lv:s.lv,last:p.last,online:p.online,act:!fz&&now-p.last<2*BDAY,fz,tr:gTrait(i)})}
 const realOf=uid=>{const x=gMemInfo({uid},now);return{cp:x.cp,last:x.unk?now:x.last}};
 const elig=[...B.values()].filter(x=>x.act&&x.lv>=C.minLv).sort((a,b)=>b.cp-a.cp);elig.forEach((x,r)=>x.pct=elig.length>1?r/(elig.length-1):.5);
 // salinan kerja keadaan guild (perubahan di tick ini ikut dihitung)
 const W=new Map(),memOf=new Map(),role=new Map(),taken=new Set();
 for(const g of GS.G.values()){W.set(g.id,{id:g.id,ref:null,g,M:new Set(g.M.map(m=>m.uid)),lead:g.lead,cap:g.cap,mode:g.mode,minlv:g.minlv,real:!B.has(g.lead)&&!!g.lead,made:g.made,lv:g.lv});taken.add(g.name.toLowerCase())}
 for(const[u,m]of GS.mem){memOf.set(u,m.gid);role.set(u,m.role)}
 const met=w=>{let cp=0,a=0;const top=[];for(const u of w.M){const x=B.get(u)||realOf(u),ac=x.act!=null?x.act:now-x.last<2*BDAY;cp+=x.cp;if(ac)a++;top.push(x.cp)}top.sort((a,b)=>b-a);const t=top.slice(0,10);w.cp=cp;w.act=a;w.top=t.length?t.reduce((s,v)=>s+v,0)/t.length:0;w.med=top.length?top[top.length>>1]:0};
 for(const w of W.values())met(w);
 const rankW=()=>{const L=[...W.values()].sort((a,b)=>b.top-a.top);L.forEach((w,r)=>w.pct=L.length>1?r/(L.length-1):.5)};rankW();
 const vAct=new Set(GS.V.map(v=>v[1])),room=w=>w.M.size<w.cap,J=new Map();
 const leave=(uid,why,ts)=>{const gid=memOf.get(uid);if(gid==null)return;const w=W.get(gid);if(w)w.M.delete(uid);memOf.delete(uid);role.delete(uid);ops.push(['l',[uid],why,ts||at()])};
 const join=(uid,w,ts)=>{w.M.add(uid);memOf.set(uid,w.ref||w.id);role.set(uid,0);const k=w.ref||w.id;if(!J.has(k))J.set(k,[[],[]]);const e=J.get(k);e[0].push(uid);e[1].push(ts||at())};
 const actOf=u=>{const x=B.get(u);return x?x.act:now-realOf(u).last<2*BDAY};
 const succOf=(w,ex)=>[...w.M].filter(u=>u!==ex&&B.has(u)&&B.get(u).act).sort((a,b)=>(role.get(b)||0)-(role.get(a)||0)||B.get(b).cp-B.get(a).cp)[0];
 const rebelOf=w=>{let best=null,bs=0;for(const u of w.M){if(u===w.lead)continue;const x=B.get(u);if(!x||!x.act||x.tr.amb<.55)continue;const s=x.tr.amb+(role.get(u)||0)*.3+(1-x.pct)*.3;if(s>bs){bs=s;best=u}}return best};
 const startVote=(w,who,why)=>{if(vAct.has(w.id))return;vAct.add(w.id);const g={id:w.id,M:[...w.M].map(uid=>({uid}))};ops.push(['v',w.id,who,w.lead,now+C.vote.ms,gStances(g,who,w.lead,now),gVoteRes(g,who,w.lead,now),why])};
 // 1) ketua: pengganti bila berhenti / lama tidak aktif; mosi kudeta bila mulai jarang aktif atau tidak disukai
 for(const w of W.values()){if(!w.M.size)continue;const L=B.get(w.lead);
  if(L){const off=(now-L.last)/BDAY;
   if((!L.act&&off>=3)||(L.fz&&off>=1)){const s=succOf(w,w.lead);if(s){ops.push(['L',w.id,s,'succ',at()]);role.set(w.lead,0);role.set(s,3);w.lead=s}}
   else if(off>=1&&!vAct.has(w.id)&&R()<hz(SIM.coupDay)){const c=rebelOf(w);if(c)startVote(w,c,'ketua jarang aktif')}
   else if(!vAct.has(w.id)&&w.M.size>=10&&R()<hz(SIM.powerDay)){const c=rebelOf(w),X=c&&B.get(c);if(X&&X.cp>L.cp*1.5&&gAff(X.i,L.i)<.1)startVote(w,c,'perebutan kekuasaan')}}
  else if(w.real){const off=(now-realOf(w.lead).last)/BDAY,Rr=GS.R[w.lead]||{},rs=[...w.M].filter(u=>B.has(u)&&B.get(u).act).map(u=>Rr[u]||0),avg=rs.length>=5?rs.reduce((a,b)=>a+b,0)/rs.length:0;
   if(off>=7){const s=succOf(w,w.lead);if(s){ops.push(['L',w.id,s,'succ',at()]);role.set(w.lead,0);role.set(s,3);w.lead=s}}
   else if(!vAct.has(w.id)&&((off>=3&&R()<hz(SIM.coupDay))||(avg<-15&&R()<hz(.12)))){const c=rebelOf(w);if(c)startVote(w,c,off>=3?'ketua menghilang':'anggota tidak puas')}}}
 // 2) guild bot yang sepi bubar · ketua mengeluarkan anggota yang lama tidak aktif saat guild hampir penuh
 for(const w of [...W.values()]){if(w.real||!B.has(w.lead))continue;
  if(now-w.made>2*BDAY&&w.act<=2&&w.M.size<=8&&R()<hz(SIM.dieDay)){ops.push(['d',w.id,at(),'sepi']);for(const u of w.M){memOf.delete(u);role.delete(u)}W.delete(w.id);continue}
  if(w.M.size>=w.cap-1){const L=B.get(w.lead);if(L&&R()<.5+L.tr.tegas*.5){const idle=[...w.M].filter(u=>u!==w.lead&&(B.has(u)?now-B.get(u).last>4*BDAY:now-realOf(u).last>4*BDAY)).sort((a,b)=>(B.get(a)||realOf(a)).last-(B.get(b)||realOf(b)).last).slice(0,2);
   if(idle.length){ops.push(['k',w.id,idle,at(),'tidak aktif']);for(const u of idle){w.M.delete(u);memOf.delete(u);role.delete(u)}}}}}
 // 3) bot di guild: pindah ke guild yang lebih cocok (ikut teman akrab) · wakil ambisius memisahkan diri bikin guild baru
 let hops=0,nF=0;const founds=[];
 const best=(x,ex)=>{let bw=null,bs=-1e9;for(const w of W.values()){if(w.id===ex||w.ref===ex||!room(w)||x.lv<w.minlv)continue;if(w.real&&w.mode===2)continue;
   if(w.pct<.15&&w.M.size>=w.cap*.7&&x.cp<w.med*.55)continue;   // guild elit hampir penuh menolak yang jauh lebih lemah
   let s=-2.3*Math.abs((w.pct??.5)-x.pct)+.25*Math.log1p(w.M.size)+.06*(w.lv||1)+(w.act/Math.max(1,w.M.size))*.6+R()*.5;
   if(w.real)s+=relOf(w.lead,x.uid)/80;if(s>bs){bs=s;bw=w}}return bw};
 const found=(x,why)=>{const name=gNameGen(x.i,taken,(k+nF)%997);taken.add(name.toLowerCase());const elite=x.pct<.1,mode=R()<.3?1:0,minlv=elite?Math.max(C.minLv,Math.floor(x.lv*.7)):C.minLv;
  const notes=elite?['cari member aktif & kuat','top server incoming, wajib aktif','aktif absen, CP tinggi','fokus push peringkat']:['santai yang penting absen','aktif absen & donasi ya','saling bantu, no drama','welcome semua, ayo rame'];
  const ref='@'+nF++;ops.push(['f',x.uid,name,Math.floor(R()*100),mode,minlv,at(),notes[Math.floor(R()*notes.length)]]);
  const w={id:ref,ref,g:null,M:new Set([x.uid]),lead:x.uid,cap:C.cap(1),mode,minlv,real:false,made:now,lv:1,cp:x.cp,act:1,top:x.cp,med:x.cp,pct:x.pct};W.set(ref,w);memOf.set(x.uid,ref);role.set(x.uid,3);founds.push(w);return w};
 for(const x of elig){if(hops>=60)break;const gid=memOf.get(x.uid);if(gid==null)continue;const w=W.get(gid);if(!w||w.ref||w.lead===x.uid)continue;
  const dead=w.act/Math.max(1,w.M.size)<.35,grown=Math.max(0,(w.pct??.5)-x.pct-.25);
  // memisahkan diri: wakil/elit ambisius yang tidak cocok dengan ketua bot, guild besar
  const L=B.get(w.lead);
  if(L&&(role.get(x.uid)||0)>=1&&x.tr.amb>.72&&w.M.size>=w.cap*.8&&gAff(x.i,L.i)<.15&&nF<8&&R()<hz(SIM.splitDay)){
   const fr=[...w.M].filter(u=>u!==x.uid&&u!==w.lead&&B.has(u)&&B.get(u).act&&gAff(x.i,B.get(u).i)>.5).slice(0,6);
   leave(x.uid,'memisahkan diri');fr.forEach(u=>leave(u,'ikut '+botName(x.i)));const nw=found(x,'split');fr.forEach(u=>join(u,nw));hops+=1+fr.length;continue}
  if(R()>=hz(SIM.hopDay*(1-x.tr.loy)*(1+grown*6)+(dead?.3:0)))continue;
  const tg=best(x,gid);if(!tg||!((tg.pct??.5)<(w.pct??.5)-.08||dead))continue;
  leave(x.uid,dead?'guild sepi':'pindah');join(x.uid,tg);hops++;
  for(const u of [...w.M]){const f=B.get(u);if(!f||!f.act||u===w.lead||!room(tg))continue;if(gAff(x.i,f.i)>.95&&R()<.45){leave(u,'ikut '+botName(x.i));join(u,tg);hops++}}}
 // 4) guild baru berdiri (jumlah guild mengikuti populasi; saat fitur baru dibuka: banyak sekaligus)
 const alive=[...W.values()].filter(w=>w.act>=3).length,want=Math.ceil(elig.length/SIM.per)-alive;
 const nless=elig.filter(x=>!memOf.has(x.uid)&&!x.tr.lone).length;
 if(want>0){const cap=launch?40:Math.max(1,Math.min(25,Math.ceil(nless/150),Math.ceil(gapD*72)*4));
  const cand=elig.filter(x=>!memOf.has(x.uid)&&!x.tr.lone&&x.lv>=C.minLv+3).map(x=>[x,x.tr.amb*.55+(1-x.pct)*.35+R()*.35]).sort((a,b)=>b[1]-a[1]);
  const n0=nF;for(const[x]of cand){if(nF-n0>=Math.min(want,cap))break;found(x,'baru')}}
 // 5) bot tanpa guild mencari guild (yang lebih kuat cenderung ke guild kuat)
 rankW();const look=launch?.9:hz(SIM.lookDay);let nj=0;const lim=launch?2400:900;
 for(const x of elig){if(nj>=lim)break;if(memOf.has(x.uid)||x.tr.lone||R()>=look)continue;const tg=best(x,null);if(!tg)continue;
  if(tg.real&&tg.mode===1){ops.push(['a',tg.id,[x.uid],at()]);continue}
  join(x.uid,tg);nj++}
 // 6) jabatan di guild berketua bot: wakil = anggota aktif kuat yang cocok dengan ketua; wakil lama tidak aktif diturunkan
 for(const w of W.values()){if(w.ref||w.real||!B.has(w.lead)||w.M.size<4)continue;const L=B.get(w.lead),want=w.M.size>=10?2:1;
  const V=[...w.M].filter(u=>role.get(u)===2),E=[...w.M].filter(u=>role.get(u)===1);let ch=0;
  for(const u of V){const x=B.get(u);if(x&&!x.act&&ch<2){ops.push(['r',w.id,u,0,at()]);role.set(u,0);ch++}}
  const cand=[...w.M].filter(u=>u!==w.lead&&(role.get(u)||0)<2&&B.has(u)&&B.get(u).act).map(u=>[u,(1-B.get(u).pct)*.6+gAff(L.i,B.get(u).i)*.4]).sort((a,b)=>b[1]-a[1]);
  let nv=[...w.M].filter(u=>role.get(u)===2).length;
  while(nv<want&&cand.length&&ch<2){const[u]=cand.shift();ops.push(['r',w.id,u,2,at()]);role.set(u,2);nv++;ch++}
  const ne=[...w.M].filter(u=>role.get(u)===1).length,ce=cand.filter(([u])=>!(role.get(u)>=1));if(ne<Math.min(G_CFG.elite,Math.floor(w.M.size/6))&&ce.length&&ch<2){const[u]=ce[0];ops.push(['r',w.id,u,1,at()]);role.set(u,1);ch++}}
 // 7) absen & donasi harian anggota bot (saat sesi pertama mereka hari itu) → xp guild
 for(const w of W.values()){if(w.ref)continue;let xp=0;
  for(const u of w.M){const x=B.get(u);if(!x||!x.act)continue;const b=botBase(x.i),jm=GS.mem.get(u),jt=jm?jm.joined:now;
   for(let d=wibDay(t0);d<=wibDay(now);d++){const ss=botSessions(b,d);if(!ss.length)continue;const ci=ss[0][0]+(60+bHash(x.i,d)%540)*1e3;if(ci>t0&&ci<=now&&ci>=jt)xp+=10+gDonXp(x,d)}}
  if(xp)ops.push(['x',w.id,xp])}
 for(const[g,[u,t]]of J)ops.push(['j',g,u,t]);
 return ops}
// donasi harian bot sesuai dompet: F2P emas (20), spender permata (60), sultan donasi besar (150)
function gDonXp(x,d){const id=botBase(x.i).tier.id,r=bRng(bHash(x.i,d*13+5))();
 return id==='f2p'?(r<.6?20:0):id==='low'||id==='card'?20+(r<.25?60:0):id==='mid'?60+(r<.15?150:0):60+(r<.5?150:0)}
async function gTick(){if(!loggedIn()||NET.acct.watch||GS.tickBusy||document.hidden||!botsWarmOk()||!BOTS.uids||!BOTS.uids.length)return;
 const L=document.getElementById('login');if(L&&L.classList.contains('on'))return;
 const now=Date.now(),k=Math.floor(now/G_CFG.tick),last=Math.max(GS.srv===netSrv()?GS.tk:0,NET.gtk||0);if(k<=last)return;
 if(now-k*G_CFG.tick<(+NET.acct.uid%67)*1200)return;   // jeda acak per pemain: tidak semua game menghitung bersamaan
 GS.tickBusy=true;
 try{await gLoad(true);if(!gReady()||GS.tk>=k)return;const ops=gSim(now,k);
  const o=await api('/api/g/tick',{tok:netTok(),k,ops});
  if(o&&o.ok){GS.tk=k;NET.gtk=k;await gLoad(true)}else if(o&&o.e==='old'){GS.tk=Math.max(GS.tk,o.tk||k);NET.gtk=GS.tk}
 }catch(e){console.warn('gTick',e)}finally{GS.tickBusy=false}}
setInterval(gTick,2e4);

/* ---------- bujuk bot masuk guild-ku ---------- */
// peluang bot mau pindah: relasi denganku, guild-ku lebih kuat atau tidak, kesetiaan, lama di guild, jabatan, teman akrab di guild-ku
function gInvP(i){const me=gMine();if(!me)return 0;const uid=botUid(i),s=botSum(i),tr=gTrait(i),g0=gBotGuild(i),now=Date.now();
 if(s.lv<me.minlv||me.M.length>=me.cap||botFrozen(i,now))return 0;
 let p=.12+relEff(uid)/120,why=[];
 if(!g0)p+=.35;else{const P=gPowAll(),n=Math.max(1,GS.G.size-1),a=(P.get(g0.id).rk-1)/n,b=(P.get(me.id).rk-1)/n;p+=(a-b)*.8;p-=tr.loy*.35;
  const m=GS.mem.get(uid);p-=Math.min(.2,(now-m.joined)/BDAY*.02);if(m.role===3)p-=.5;else if(m.role===2)p-=.15;
  const pw=P.get(g0.id);if(pw.act/Math.max(1,pw.n)<.35)p+=.25;
  if(me.M.some(x=>{const j=botIdxOf(x.uid);return j>=0&&gAff(i,j)>1}))p+=.2}
 if(tr.lone)p*=.3;return Math.max(.02,Math.min(.9,p))}
// penjelasan singkat untuk AI DM (alasan bot mau / tidak mau pindah)
function gInvHint(i){const g0=gBotGuild(i),me=gMine(),tr=gTrait(i),uid=botUid(i),L=[];if(!me)return'';
 const P=gPowAll();if(!g0)L.push('belum punya guild');else{const m=GS.mem.get(uid),pa=P.get(g0.id),pb=P.get(me.id);L.push(`sekarang di ${g0.name} (peringkat #${pa.rk}, ${G_ROLE[m.role]}, sudah ${Math.max(1,Math.round((Date.now()-m.joined)/BDAY))} hari)`);
  L.push(pb.rk<pa.rk?`guild ${NET.acct.u} lebih kuat (#${pb.rk})`:`guild ${NET.acct.u} lebih lemah (#${pb.rk})`);if(pa.act/Math.max(1,pa.n)<.35)L.push('guildnya sekarang sepi');if(m.role===3)L.push('dia ketua guildnya, berat meninggalkan anggotanya')}
 L.push(tr.loy>.7?'orangnya setia':tr.loy<.3?'gampang pindah kalau ada yang lebih bagus':'cukup setia');L.push('rasa suka ke '+NET.acct.u+': '+relTier(relEff(uid)));
 const p=gInvP(i);L.push('kecenderungan: '+(p>.6?'mau':p>.35?'ragu-ragu':'kemungkinan menolak'));return L.join('; ')}
// kapan bot online lagi (awal sesi berikutnya + sebentar)
function gNextOn(i,now=Date.now()){const b=botBase(i);if(b.endT<now)return null;for(let d=wibDay(now);d<=wibDay(now)+3;d++)for(const[s0]of botSessions(b,d))if(s0>now)return s0+(30+bHash(i,d)%210)*1e3;return null}
async function gInvite(i){const me=gMine();if(!me)return{ok:false,e:'noguild'};const uid=botUid(i),p=gInvP(i),ok=Math.random()<p,now=Date.now();
 const pres=botPres(i,now),at=pres.online?now+(4+Math.random()*20)*1e3:gNextOn(i,now);
 if(!pres.online){S.gInvQ=(S.gInvQ||[]).filter(x=>x.uid!==uid).concat([{uid,i,ok,t:now,at:at||now+6*36e5,gid:me.id}]).slice(-20);save();return{ok:true,st:'wait'}}
 await sleep(1200+Math.random()*2500);const o=await api('/api/g/inv',{tok:netTok(),uid,ok:ok?1:0,at:Math.round(now)});
 if(o&&o.ok){relBump(uid,ok?5:-1);await gLoad(true)}return o}
// ajakan ke bot yang sedang offline: dijawab saat dia online
async function gInvQTick(){const Q=S.gInvQ||[];if(!Q.length||!loggedIn())return;const now=Date.now(),me=gMine();
 for(const x of Q.slice()){if(x.at>now)continue;S.gInvQ=(S.gInvQ||[]).filter(y=>y!==x);save();if(!me||me.id!==x.gid)continue;
  const o=await api('/api/g/inv',{tok:netTok(),uid:x.uid,ok:x.ok?1:0,at:Math.round(x.at)});if(o&&o.ok){if(x.ok){toast(T('{n} menerima ajakanmu dan bergabung ke guild!',{n:botName(x.i)}));sfx('claim');await gLoad(true)}else toast(T('{n} menolak ajakan guild-mu.',{n:botName(x.i)}))}}}
setInterval(gInvQTick,3e4);

/* ---------- undangan dari bot (sebaliknya: bot mengajakku) ---------- */
// teman bot yang akrab di guild yang cocok, atau pengurus guild kuat yang merekrut pemain kuat
function gOfferTick(){if(!loggedIn()||NET.acct.watch)return;if(!gReady()){if(botsWarmOk())gLoad();return}relLoad();if(!botsWarmOk())return;const now=Date.now();S.gOffer=(S.gOffer||[]).filter(o=>now-o.t<2*BDAY&&GS.G.has(o.gid));
 if(S.gOfferAt&&now-S.gOfferAt<2*36e5)return;S.gOfferAt=now;if(S.lv<G_CFG.minLv)return;const me=gMine(),P=gPowAll(),n=Math.max(1,GS.G.size-1),mp=me?(P.get(me.id).rk-1)/n:1,R=bRng((now/36e5|0)*31+(+NET.acct.uid%9973));
 const L=[...GS.G.values()].filter(g=>(!me||g.id!==me.id)&&g.M.length<g.cap&&!S.gOffer.some(o=>o.gid===g.id));if(!L.length)return;
 // 1) teman bot akrab
 for(const f of(NET.friends&&NET.friends.friends)||[]){if(f.bot==null)continue;const i=botIdxOf(f.uid);if(i<0)continue;const g=gBotGuild(i);if(!g||!L.includes(g))continue;const v=relEff(f.uid);
  if(v>=20&&(!me||(P.get(g.id).rk-1)/n<mp-.05)&&R()<.25+v/200&&botPres(i,now).online){S.gOffer.push({gid:g.id,by:f.uid,t:now,why:'teman'});save();if(typeof refreshBadges==='function')refreshBadges();return}}
 // 2) perekrut guild kuat untuk pemain kuat (CP-ku sepadan dengan guild itu)
 const myCp=teamPow();for(const g of L.sort((a,b)=>P.get(a.id).rk-P.get(b.id).rk).slice(0,25)){const pw=P.get(g.id),avg=pw.cp/Math.max(1,pw.n);
  if(myCp<avg*.75||(me&&(pw.rk-1)/n>=mp-.1))continue;const off=g.M.filter(m=>m.role>=2&&botIdxOf(m.uid)>=0&&botPres(botIdxOf(m.uid),now).online);if(!off.length||R()>.35)continue;
  S.gOffer.push({gid:g.id,by:off[0].uid,t:now,why:'rekrut'});save();if(typeof refreshBadges==='function')refreshBadges();return}}
setInterval(gOfferTick,6e4);

/* ---------- konteks AI: guild & teman akrab bot (untuk Obrolan Dunia, DM, Obrolan Guild) ---------- */
function gBotPub(i){const g=gBotGuild(i);if(!g)return'';const m=GS.mem.get(botUid(i));return`, guild ${g.name}${m&&m.role?` (${G_ROLE[m.role]})`:''}`}
function gBotPriv(i){const F=gBotFriends(i);return F.length?`, teman akrab di guild: ${F.map(x=>botName(x.j)).join(' & ')}`:''}
const gBotFriends=gBestFriends;
// konteks DM dengan bot (dipakai ui/social.js): guild kami berdua, ajakan, mosi
function gDmCtx(i){if(!gReady())return{};const me=gMine(),g0=gBotGuild(i),uid=botUid(i),P=gPowAll(),o={};
 if(me){const pm=P.get(me.id),r=GS.mem.get(NET.acct.uid);o.mine=`${me.name} (Lv ${me.lv}, peringkat #${pm.rk}, ${me.M.length}/${me.cap} anggota, ${NET.acct.u} ${G_ROLE[r.role]})`}
 if(g0){const pa=P.get(g0.id),m=GS.mem.get(uid);o.theirs=`${g0.name} (Lv ${g0.lv}, peringkat #${pa.rk}), jabatan ${G_ROLE[m.role]}, sudah ${Math.max(1,Math.round((Date.now()-m.joined)/BDAY))} hari${me&&me.id===g0.id?' — SATU GUILD dengan '+NET.acct.u:''}`}
 const inv=S.gInvDM&&S.gInvDM[uid]>Date.now();if(inv&&me&&(!g0||g0.id!==me.id)){o.inv=true;o.hint=gInvHint(i);o.ok=Math.random()<gInvP(i)}
 const of=(S.gOffer||[]).find(x=>x.by===uid&&GS.G.has(x.gid));if(of&&(!me||me.id!==of.gid))o.recruit=`kamu sudah mengundang ${NET.acct.u} masuk guild-mu ${GS.G.get(of.gid).name} (undangannya menunggu di tab Undangan guild ${NET.acct.u}); kalau ia mau, suruh ia terima di sana`;
 const v=g0&&me&&g0.id===me.id?gVoteOf(g0.id):null;if(v){const w=v.who===NET.acct.uid?NET.acct.u:gMemInfo({uid:v.who}).name,t=gMemInfo({uid:v.tgt}).name;o.vote=`${w} ingin menggulingkan ketua ${t} (berakhir ${new Date(v.t1).toTimeString().slice(0,5)})${v.who===NET.acct.uid?'; '+NET.acct.u+' minta dukunganmu':v.tgt===NET.acct.uid?'; '+NET.acct.u+' adalah ketua yang mau digulingkan':''}`}
 return o}

/* ---------- kalimat obrolan guild para bot (tanpa AI, tidak disimpan: sama di semua game) ---------- */
function gVirt(g,info,from,to){const out=[],now=Date.now(),wbN=t=>{try{const c=wbCur(t);const t0=c.t0||c.next;return t0?{b:T(wbBoss(t0).n),j:new Date(t0).toTimeString().slice(0,5)}:{b:'bos',j:'20:00'}}catch(e){return{b:'bos',j:'20:00'}}};
 const bots=g.M.map(m=>({m,i:botIdxOf(m.uid)})).filter(x=>x.i>=0&&botIn(x.i,now));if(!bots.length)return out;
 const nm=uid=>{const i=botIdxOf(uid);return i>=0?botName(i):uid===(NET.acct&&NET.acct.uid)?S.name:gMemInfo({uid}).name};
 const fill=(s,o)=>s.replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?o[k]:'');
 const onAt=(t,R,ex)=>{const L=bots.filter(x=>x.m.joined<=t&&x.m.uid!==ex&&botPres(x.i,t).online);return L.length?L[Math.floor(R()*L.length)]:null};
 // obrolan sehari-hari per jam
 for(let h=Math.floor(from/36e5);h*36e5<=to;h++){const R=bRng(bHash(g.id,h*7+1)),t=h*36e5+Math.floor(R()*36e5);if(t<from||t>to)continue;
  const hr=new Date(t+BOT_CFG.TZ*36e5).getUTCHours(),L=hr>=5&&hr<11?GCH.pagi:hr>=11&&hr<18?GCH.siang:GCH.malam,n=R()<.55?1:R()<.3?2:0;
  for(let q=0;q<n;q++){const x=onAt(t+q*9e4,R);if(!x)break;out.push({uid:x.m.uid,u:botName(x.i),txt:fill(L[Math.floor(R()*L.length)],wbN(t)),ts:t+q*9e4+Math.floor(R()*6e4),v:1})}}
 // tanggapan atas peristiwa guild
 for(const e of(info&&info.log)||[]){if(e.ts<from-36e5||e.ts>to)continue;const R=bRng(bHash(g.id,e.id*13+5)),pk=L=>L[Math.floor(R()*L.length)];let L=null,o={},ex=null,n=1;
  if(e.ty==='j'){const us=String(e.a||'').split(',');o.n=us.slice(0,2).map(nm).join(' & ');L=GCH.join;ex=us[0];if(us.length===1&&botIdxOf(us[0])>=0&&R()<.5){const i=botIdxOf(us[0]);out.push({uid:us[0],u:botName(i),txt:pk(GCH.self),ts:e.ts+4e4,v:1})}}
  else if(e.ty==='l'){o.n=String(e.a||'').split(',').slice(0,2).map(nm).join(' & ');L=/^dibujuk/.test(e.x||'')?GCH.poach:GCH.left}
  else if(e.ty==='k'){o.n=nm(e.a);L=GCH.kick}else if(e.ty==='lvup'){o.lv=e.x;o.nx=Math.min(10,+e.x+1);L=GCH.lvup;n=2}else if(e.ty==='L'){o.n=nm(e.a);L=GCH.lead;n=2}
  else if(e.ty==='vote'){o.n=nm(e.a);L=GCH.vote;n=3}else if(e.ty==='coup'){o.n=nm(e.a);L=GCH.coup;n=2}else if(e.ty==='coupno'){L=GCH.coupno}else if(e.ty==='found'){const fi=botIdxOf(e.a);if(fi>=0){out.push({uid:e.a,u:botName(fi),txt:pk(GCH.found),ts:e.ts+6e4,v:1})}continue}
  if(!L)continue;for(let q=0;q<n;q++){const t=e.ts+(30+R()*240+q*70)*1e3;if(t>now)break;const x=onAt(t,R,ex)||(q===0?bots[Math.floor(R()*bots.length)]:null);if(!x)continue;out.push({uid:x.m.uid,u:botName(x.i),txt:fill(pk(L),o),ts:Math.round(t),v:1})}}
 // pemain (aku) masuk 10 besar CP server → sesekali dibanggakan rekan guild
 const fr=S.fame&&S.fame.rk;if(fr&&fr<=10&&loggedIn()&&g.M.some(m=>m.uid===NET.acct.uid))for(let h=Math.floor(from/(3*36e5));h*3*36e5<=to;h++){const R=bRng(bHash(g.id,h*11+7));if(R()>.3)continue;const t=h*3*36e5+Math.floor(R()*3*36e5);if(t<from||t>to)continue;const x=onAt(t,R,NET.acct.uid);if(x)out.push({uid:x.m.uid,u:botName(x.i),txt:fill(GCH.fame[Math.floor(R()*GCH.fame.length)],{n:S.name,k:fr<=1?'#1':fr<=3?'top 3':'top 10'}),ts:t,v:1})}
 return out.filter(m=>m.ts<=now)}

/* ---------- tindakan pemain ---------- */
async function gApi(act,body){const o=await api('/api/g/'+act,Object.assign({tok:netTok()},body||{}));if(o&&o.ok&&!/^(chat|info|myapps)$/.test(act)){NET.gv=null;await gLoad(true)}return o}
async function gInfo(gid,force){if(!force&&GS.info[gid]&&Date.now()-GS.infoAt[gid]<15e3)return GS.info[gid];const o=await api('/api/g/info',{gid,tok:loggedIn()?netTok():undefined});
 if(o&&o.ok){GS.info[gid]=o;GS.infoAt[gid]=Date.now();GS.cards=GS.cards||{};for(const m of o.mem)if(m.bot==null)GS.cards[m.uid]=m}return o}
const gToday=()=>wibDay(Date.now());
// mosi yang aku mulai: sikap bot dihitung di sini
async function gVoteStart(why){const me=gMine();if(!me)return{ok:false};const st=gStances(me,NET.acct.uid,me.lead),res=gVoteRes(me,NET.acct.uid,me.lead);return gApi('vote',{op:'start',st,res,why})}
// bujuk anggota bot mengubah sikap di mosi (tanpa AI): relasi & sikap awal menentukan peluang
function gSwayP(i,v){const sc=gStanceScore(i,v.who,v.tgt,Date.now(),v.gid);return Math.max(.05,Math.min(.85,.3+relEff(botUid(i))/120-Math.abs(sc)*.25))}
