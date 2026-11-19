/* =====================================================================
   BOS DUNIA — logika (data: data/worldboss.js · tampilan: ui/worldboss.js)
   - Jadwal tetap (WB_CFG.slots, WIB). Satu raid = t0 (awal pertarungan) s/d t0+dur.
   - HP bersama: HP bos − damage bot (dihitung sama di semua perangkat dari rumus & benih acak, seperti dunia bot)
     − damage pemain asli (server /api/wb, dikirim tiap WB_CFG.report ms).
   - Bot ikut raid lewat wbAttend(b,t0) — murni (tanpa botState), dipakai juga botSessions → jumlah online melonjak.
   - Pertarungan: mode B.st.wb (systems/battle.js): bos tidak pernah mati lokal; tim tumbang → bangkit 10 dtk.
   - Hadiah dikirim ke Kotak Surat setelah raid selesai (wbSettle) + hadiah mingguan Poin Pemburu.
   S.wb = {log:{[t0]:{dmg,boss,lh,settled}}, wk:{id,pts}, title:{n,until}}
   ===================================================================== */
const WB={srv:{},cache:new Map(),sync:0,post:0,lastNote:null,inBattle:false};
const wbSlotT=(d,h)=>d*BDAY-BOT_CFG.TZ*36e5+h*36e5;
const wbEnd=t0=>t0+WB_CFG.dur;
const wbOpen=()=>typeof featOK==='function'&&featOK('wb');
// raid terdekat: st = 'pre' | 'live' | 'after' | 'idle'; next = awal raid berikutnya
function wbCur(now=Date.now()){const d=wibDay(now),C=WB_CFG;let next=null;
 for(const dd of[d-1,d,d+1])for(const h of C.slots){const t0=wbSlotT(dd,h);
  if(now>=t0-C.pre&&now<t0)return{t0,st:'pre'};if(now>=t0&&now<t0+C.dur)return{t0,st:'live'};if(now>=t0+C.dur&&now<t0+C.dur+C.after)return{t0,st:'after'};
  if(t0>now&&(next==null||t0<next))next=t0}
 return{t0:next,st:'idle',next}}
const wbBoss=t0=>WB_BOSS[bHash(Math.floor(t0/36e5),4242)%WB_BOSS.length];
// kunci raid untuk server: '2026-11-19T20'
function wbKey(t0){const d=new Date(t0+BOT_CFG.TZ*36e5);return d.toISOString().slice(0,13)}
const wbWeek=t=>Math.floor((wibDay(t)+3)/7);   // Senin 00:00 WIB
const wbDps=cp=>WB_CFG.dps.k*Math.pow(Math.max(100,cp),WB_CFG.dps.a);

/* ---------- kehadiran bot (murni: hanya botBase + kurva level) ---------- */
const WB_ATT={santai:.22,reguler:.38,rajin:.6,hardcore:.82};
function wbAttend(b,t0){const C=WB_CFG;if(t0<C.from||t0+C.dur<b.join||!botActive(b,t0))return null;if(botLvTime(b,C.lv)>t0)return null;
 const r=bRng(bHash(b.i,Math.floor(t0/6e4)+31)),h=new Date(t0+BOT_CFG.TZ*36e5).getUTCHours(),W=BOT_CFG.HOURS[h]/6.5;
 if(r()>(WB_ATT[b.pf]||.35)*(.5+.5*W))return null;
 const late=r()<.22,arrive=late?t0+r()*.45*C.dur:t0-C.pre*(.1+.85*r()),fj=Math.max(t0,arrive)+(6+r()*24)*1e3;
 const fl=r()<.18?t0+C.dur*(.3+r()*.55):t0+C.dur;
 return{arrive,fj,fl,off:Math.max(fl,t0+C.dur)+(2+r()*13)*6e4,q:.8+r()*.4}}

/* ---------- satu raid (dicache) ---------- */
function wbRaid(t0){if(WB.cache.has(t0))return WB.cache.get(t0);const C=WB_CFG,n=botsVisible(t0+C.dur),P=[];
 for(let i=0;i<n;i++){if(typeof botHidden==='function'&&botHidden(i))continue;const b=botBase(i),a=wbAttend(b,t0);if(!a)continue;
  const cp=botState(i).cp;P.push(Object.assign({i,dps:wbDps(cp)*a.q,cp},a))}
 const r=bRng(bHash(Math.floor(t0/6e4),977)),full=P.reduce((s,p)=>s+p.dps*(p.fl-p.fj)/1000,0),x=r();
 const k=x<.12?1.08+r()*.17:x<.32?.92+r()*.08:.62+r()*.28;
 const R={t0,boss:wbBoss(t0),P,hp:Math.max(4e5,Math.round(full*k/1000)*1000)};
 if(WB.cache.size>40)WB.cache.clear();WB.cache.set(t0,R);return R}
const wbBotDmgAt=(p,t)=>p.dps*Math.max(0,Math.min(t,p.fl)-p.fj)/1000;
const wbBotsDmg=(R,t)=>R.P.reduce((s,p)=>s+wbBotDmgAt(p,t),0);
// damage pemain asli lain (server) + punyaku (lokal, paling baru)
function wbRealOthers(t0){const s=WB.srv[t0];if(!s)return[];const me=typeof loggedIn==='function'&&loggedIn()?String(NET.acct.uid):null;return(s.rows||[]).filter(r=>String(r.uid)!==me)}
const wbMine=t0=>((S.wb&&S.wb.log[t0])||{}).dmg||0;
function wbMineLive(t0){let d=wbMine(t0);if(B&&B.st.wb&&B.wbT0===t0)d+=wbBattleDmg()-B.wbBase;return Math.round(d)}
// waktu bos tumbang (null = belum / kabur): damage pemain asli dianggap sudah masuk
function wbKillT(R,real){const end=wbEnd(R.t0),need=R.hp-real;if(need<=0)return R.t0;if(wbBotsDmg(R,end)<need)return null;
 let lo=R.t0,hi=end;for(let k=0;k<40;k++){const m=(lo+hi)/2;if(wbBotsDmg(R,m)>=need)hi=m;else lo=m}return hi}
// keadaan raid saat ini: hp tersisa, fase, tumbang?
function wbState(t0,now=Date.now()){const R=wbRaid(t0),real=wbRealOthers(t0).reduce((s,r)=>s+r.dmg,0)+wbMineLive(t0);
 const kt=wbKillT(R,real),tt=Math.min(now,wbEnd(t0),kt??Infinity),bot=wbBotsDmg(R,tt),left=Math.max(0,R.hp-bot-real),p=left/R.hp;
 const ph=WB_CFG.ph.filter(x=>p<=x).length;return{R,hp:R.hp,left,p,ph,dead:kt!=null&&now>=kt,killT:kt,escaped:now>=wbEnd(t0)&&(kt==null||kt>now),tt}}
// papan peringkat damage
function wbBoard(t0,now=Date.now()){const st=wbState(t0,now),L=[];
 for(const p of st.R.P){const d=wbBotDmgAt(p,st.tt);if(d>0||now>=p.arrive)L.push({bot:p.i,name:botName(p.i,now),dmg:Math.round(d),cp:p.cp})}
 for(const r of wbRealOthers(t0))L.push({uid:r.uid,name:r.u,dmg:r.dmg,cp:r.cp});
 const md=wbMineLive(t0);if(md>0||(B&&B.st.wb))L.push({me:1,name:S.name,dmg:md,cp:teamPow()});
 L.sort((a,b)=>b.dmg-a.dmg);L.forEach((e,k)=>e.rank=k+1);return{st,L,me:L.find(e=>e.me)}}

/* ---------- server ---------- */
async function wbPull(t0,force){const now=Date.now();if(!force&&now-WB.sync<4500)return;WB.sync=now;
 try{const o=await api('/api/wb?slot='+wbKey(t0));if(o&&o.ok)WB.srv[t0]={rows:o.rows||[],lh:o.lh||null,ts:now}}catch(e){}}
async function wbPush(t0,force){const now=Date.now();if(!loggedIn()||(!force&&now-WB.post<WB_CFG.report))return;WB.post=now;const d=wbMineLive(t0);if(!d)return;
 try{await api('/api/wb',{tok:netTok(),slot:wbKey(t0),dmg:d,cp:teamPow()})}catch(e){}}
async function wbClaimLast(t0){if(!loggedIn())return false;try{const o=await api('/api/wb',{tok:netTok(),slot:wbKey(t0),lh:1});return!!(o&&o.lh&&String(o.lh.uid)===String(NET.acct.uid))}catch(e){return false}}

/* ---------- hadiah ---------- */
function wbRwObj(o,half){const r={},m={};for(const k in o){let v=o[k];if(half)v=Math.max(1,Math.floor(v/2));if(k==='gems'||k==='gold')r[k]=(r[k]||0)+v;else m[k]=(m[k]||0)+v}if(Object.keys(m).length)r.mats=m;return r}
function wbAdd(a,b){const r=Object.assign({},a);for(const k in b){if(k==='mats'){r.mats=Object.assign({},r.mats||{});for(const q in b.mats)r.mats[q]=(r.mats[q]||0)+b.mats[q]}else r[k]=(r[k]||0)+b[k]}return r}
const wbAvgPct=n=>100/Math.max(1,n);   // bagian rata-rata seorang penyerang (persen HP)
function wbContrib(pct,n){return WB_RW.contrib.find(x=>pct>=x.k*wbAvgPct(n))||null}
function wbRewardOf(rank,pct,escaped,last,n){const half=!!escaped;let rw=wbRwObj(WB_RW.rank.find(x=>rank<=x.to).rw,half);
 const c=wbContrib(pct,n);if(c)rw=wbAdd(rw,wbRwObj(c.rw,half));if(last)rw=wbAdd(rw,wbRwObj(WB_RW.last,false));return rw}
let WB_SETTLING=false;
async function wbSettle(){if(WB_SETTLING||!S.wb)return;const now=Date.now();WB_SETTLING=true;
 try{for(const k of Object.keys(S.wb.log)){const t0=+k,L=S.wb.log[k];if(L.settled)continue;const st=wbState(t0,now);
   if(!(st.dead||now>=wbEnd(t0)))continue;if(now<Math.min(wbEnd(t0),st.killT??Infinity)+5000)continue;   // tunggu laporan terakhir pemain lain
   if(loggedIn())await wbPull(t0,true);const b=wbBoard(t0,Math.max(now,wbEnd(t0))),me=b.me;L.settled=1;if(!me||!me.dmg){save();continue}
   const pct=me.dmg/b.st.hp*100,esc=!b.st.dead,rw=wbRewardOf(me.rank,pct,esc,!!L.lh,b.L.length),cb=wbContrib(pct,b.L.length),bn=b.st.R.boss.n;L.rank=me.rank;L.pct=pct;L.esc=esc;
   if(me.rank===1&&!esc)S.wb.title={n:T('Penakluk {b}',{b:T(bn)}),until:now+6*36e5};
   const wk=wbWeek(t0);if(!S.wb.wk||S.wb.wk.id!==wk)S.wb.wk={id:wk,pts:0,prev:S.wb.wk||null};S.wb.wk.pts+=me.dmg;
   sendMail({id:'wb_'+wbKey(t0),from:T('Penjaga Kota'),title:esc?T('{b} kabur · Hasil Bos Dunia',{b:T(bn)}):T('{b} tumbang · Hasil Bos Dunia',{b:T(bn)}),
    body:T('Kamu peringkat #{r} dari {n} penyerang dengan {d} damage ({p}% HP bos).',{r:me.rank,n:b.L.length,d:fmt(me.dmg),p:pct.toFixed(2)})+(cb?' '+T('Peti {c}!',{c:T(cb.n)}):'')+(L.lh?' '+T('Pukulan terakhir milikmu!'):'')+(esc?' '+T('Bos berhasil kabur, hadiah dipotong setengah.'):''),rw});
   save()}
  wbWeekSettle()}finally{WB_SETTLING=false}}
// Poin Pemburu bot dalam satu minggu (raid yang sudah selesai)
function wbWeekSlots(wk,now=Date.now()){const out=[],d0=wk*7-3;for(let d=d0;d<d0+7;d++)for(const h of WB_CFG.slots){const t0=wbSlotT(d,h);if(t0>=WB_CFG.from&&wbEnd(t0)<=now)out.push(t0)}return out}
function wbWeekBoard(wk,now=Date.now()){const pts=new Map();for(const t0 of wbWeekSlots(wk,now)){const R=wbRaid(t0),kt=wbKillT(R,0),tt=Math.min(wbEnd(t0),kt??Infinity);for(const p of R.P){const d=wbBotDmgAt(p,tt);if(d>0)pts.set(p.i,(pts.get(p.i)||0)+d)}}
 const L=[...pts].map(([i,d])=>({bot:i,name:botName(i,now),pts:Math.round(d)}));const my=S.wb&&S.wb.wk&&S.wb.wk.id===wk?S.wb.wk.pts:0;if(my)L.push({me:1,name:S.name,pts:Math.round(my)});
 L.sort((a,b)=>b.pts-a.pts);L.forEach((e,k)=>e.rank=k+1);return{L,me:L.find(e=>e.me)}}
function wbWeekSettle(){const w=S.wb.wk,now=Date.now(),cur=wbWeek(now);if(!w)return;
 const old=w.id<cur?w:(w.prev&&w.prev.id<cur?w.prev:null);if(!old||old.done||!old.pts)return;old.done=1;
 const b=wbWeekBoard(old.id,(old.id+1)*7*BDAY),me=b.me;if(!me){save();return}const t=WB_RW.week.find(x=>me.rank<=x.to);
 if(t)sendMail({id:'wbw_'+old.id,from:T('Penjaga Kota'),title:T('Hadiah Mingguan Pemburu Naga'),body:T('Minggu lalu kamu mengumpulkan {p} Poin Pemburu dan menutup minggu di peringkat #{r}.',{p:fmt(me.pts),r:me.rank}),rw:wbRwObj(t.rw)});
 if(w.id<cur)S.wb.wk={id:cur,pts:0,prev:old};save()}

/* ---------- pertarungan ---------- */
const wbBattleDmg=()=>B&&B.st.wb?B.units.filter(u=>u.side==='hero').reduce((s,u)=>s+(u.dmg||0),0):0;
function wbStart(){const c=wbCur();if(c.st!=='live')return toast(c.st==='pre'?T('Naga belum muncul. Tunggu sebentar!'):T('Bos Dunia sedang tidak muncul.'),1);
 if(!wbOpen())return toast(T('Bos Dunia terbuka di Lv {n}.',{n:WB_CFG.lv}),1);const ids=S.team.filter(Boolean);if(!ids.length)return toast(T('Tim kosong! Pilih hero dulu.'),1);
 const t0=c.t0,st0=wbState(t0);if(st0.dead)return toast(T('Naga sudah tumbang!'),1);
 if(!S.wb)S.wb={log:{}};if(!S.wb.log[t0])S.wb.log[t0]={dmg:0,boss:wbBoss(t0).id};save();closeModal();lobby=null;
 const boss=wbBoss(t0),st={key:'wb',wb:true,name:T(boss.n),bg:'storm',art:'storm',waves:[[]],n:WB_CFG.n,cost:0};
 B={st,wave:0,time:0,units:[],proj:[],fx:[],texts:[],pend:[],state:'enter',enterT:1,auto:S.auto,speed:1,paused:false,shake:0,flash:0,flashC:'#fff',g:$('#bc').getContext('2d'),nextT:0,limit:Infinity,wbT0:t0,wbPh:st0.ph,wbDown:0,wbFt:0,wbRank:null,wbBase:0};
 const ord=ids.slice().sort((a,b)=>ROLE[HD[b].role].melee-ROLE[HD[a].role].melee);
 ord.forEach((id,i)=>{const h=HD[id],s=heroStats(id);B.units.push(mkUnit('hero',{id,i,name:h.name,el:h.el,role:h.role,skill:h.skill,sk:h.sk,mult:h.mult,spr:sprite(h.spr),hp:s.hp,maxHp:s.hp,atk:s.atk,def:s.def,crit:s.crit,sig:s.sig,x:HPOS[i][0],y:HPOS[i][1],cdMax:1.25*ROLE[h.role].cd}))});
 const hs=B.units,avgHp=hs.reduce((a,u)=>a+u.maxHp,0)/hs.length,avgDef=hs.reduce((a,u)=>a+u.def,0)/hs.length,eb=enemyBase(diffG(WB_CFG.n));
 // serangan bos mengikuti ketahanan tim (semua orang sesekali tumbang & bangkit), pertahanan tetap → damage sebanding kekuatan
 const atk=Math.round(avgHp*WB_CFG.hit*(100+avgDef)/100);
 B.units.push(mkUnit('enemy',{i:0,name:T(boss.n),el:boss.el,role:'warrior',boss:true,wb:1,etype:'wbDragon',spr:{url:''},hp:1e15,maxHp:1e15,atk,atk0:atk,def:Math.round(eb.def*1.3),x:182,y:190,ox:110,cdMax:1.7,cd0:1.7,scale:1,skill:'aoe',mult:1.6,sk:T(boss.sk)}));
 B.sc=1;B.wbRoar=1.4;B.wbSt=st0;wbPhaseApply(true);
 if(typeof bgmPlay==='function')bgmPlay('wb');if(!BG.storm_b)BG.storm_b=makeBG('storm',240,210);bgArt('w_storm');
 $('#bTitle').textContent=T('Bos Dunia');$('#bSub').textContent=T(boss.n);battleUI();banner(T('⚠ {b} ⚠',{b:T(boss.n)}));sfx('boss');WB.inBattle=true;wbPull(t0,true)}
function wbPhaseApply(silent){const u=B.units.find(x=>x.wb);if(!u)return;const P=WB_PH[B.wbPh]||WB_PH[0];u.atk=Math.round(u.atk0*P.atk);u.cdMax=u.cd0*P.cd;
 if(!silent){B.wbRoar=1.2;banner(P.n);sfx('boss');B.shake=.6;B.flash=.6;B.flashC=B.wbPh>=3?'#ff3b3b':EL[u.el].c;if(typeof wbNote==='function')wbNote(T('Naga berubah: {p}',{p:P.n}),'ph')}}
// tim tumbang → bangkit lagi setelah WB_CFG.respawn detik
function wbDown(){B.state='down';B.downT=WB_CFG.respawn;B.wbDown++;sfx('lose')}
function wbRevive(){B.units.filter(u=>u.side==='hero').forEach((u,i)=>{Object.assign(u,{alive:true,hp:u.maxHp,charge:30,deathT:0,shieldT:0,tauntT:0,atkUpT:0,cd:.4+Math.random()*.6,dash:null,anim:null,x:HPOS[i][0],y:HPOS[i][1]});B.fx.push({k:'heal',x:u.x,y:u.y,t:0,dur:.7})});
 B.state='fight';banner(T('Bangkit!'));sfx('buff')}
// tiap frame (dipanggil tickBattle): fase, tumbang global, waktu habis, angka damage pemain lain
function wbFrame(dt){const now=Date.now(),t0=B.wbT0;if(B.state==='end')return;B.wbFt+=dt;
 if(B.wbFt<.25)return;const step=B.wbFt;B.wbFt=0;B.wbRoar=Math.max(0,(B.wbRoar||0)-step);const st=wbState(t0,now);B.wbSt=st;
 if(st.ph!==B.wbPh){B.wbPh=st.ph;wbPhaseApply()}
 if(st.dead||now>=wbEnd(t0)){const boss=B.units.find(u=>u.wb);if(st.dead&&boss){boss.alive=false;boss.deathT=.6;B.flash=.8;B.flashC='#fff';B.shake=.8;sfx('die')}
  B.wbWin=st.dead;if(st.dead&&!B.wbLhTried){B.wbLhTried=1;wbClaimLast(t0).then(ok=>{if(ok&&S.wb.log[t0]){S.wb.log[t0].lh=1;save()}})}
  wbSaveDmg();battleFin(!!st.dead);return}
 // angka damage pemain lain yang sedang menyerang (hiasan)
 const boss=B.units.find(u=>u.wb),act=st.R.P.filter(p=>now>=p.fj&&now<p.fl);
 if(boss&&act.length&&Math.random()<Math.min(.9,act.length*.12*step/.25)){const p=act[Math.floor(Math.random()*act.length)],n=Math.round(p.dps*rnd(.6,1.4)*rnd(.8,2.4));
  B.texts.push({x:boss.x+rnd(-30,22),y:boss.y-rnd(40,110),t:botName(p.i,now)+' '+fmt(n),c:'#bfe3ff',life:.9,sm:1})}}
function wbSaveDmg(){if(!B||!B.st.wb)return;const L=S.wb.log[B.wbT0];if(!L)return;const d=wbBattleDmg();L.dmg+=d-B.wbBase;B.wbBase=d;save()}
// akhir pertarungan / keluar
function wbLeave(){if(!B||!B.st.wb)return;wbSaveDmg();const t0=B.wbT0;WB.inBattle=false;wbPush(t0,true)}

/* ---------- gambar naga (strip 8 frame 208×176, abu-abu → diwarnai per wujud) ---------- */
const WBD={img:null,c:{}};const WBD_FW=208,WBD_FH=176,WBD_AX=84,WBD_BASE=170;
function wbStrip(tint,white){const k=(tint||'-')+(white?'w':'');if(WBD.c[k])return WBD.c[k];
 if(!WBD.img){WBD.img=new Image();WBD.img.src=(typeof SPRITE_SRC!=='undefined'&&SPRITE_SRC.wb_dragon)||''}
 const im=WBD.img;if(!im.complete||!im.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);
 if(tint){g.globalCompositeOperation='multiply';g.fillStyle=tint;g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='destination-in';g.drawImage(im,0,0)}
 if(white){g.globalCompositeOperation='source-atop';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}
 return WBD.c[k]=c}
function wbFrameIdx(u){if(!u.alive)return 6;const a=u.anim,t=u.animT||0;
 if(a==='skill'&&t<1)return 7;if(a==='attack'&&t<.6)return t<.28?4:5;if(a==='hit'&&t<.15)return 6;
 if(B.wbRoar>0)return B.wbRoar>.5?2:3;return Math.floor(B.time*1.6)%2}
const WBD_K=.62;   // skala gambar (satuan medan per piksel sumber)
function wbDraw(g,u,x){const boss=B.st.wb?wbBoss(B.wbT0):WB_BOSS[0],s=wbStrip(boss.tint);if(!s)return;const i=wbFrameIdx(u),w=WBD_FW*WBD_K,h=WBD_FH*WBD_K,dy=u.y-WBD_BASE*WBD_K,ax=-WBD_AX*WBD_K;
 g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(s,i*WBD_FW,0,WBD_FW,WBD_FH,ax,dy,w,h);
 if(u.hitT>0){const wh=wbStrip(boss.tint,1);if(wh){g.globalAlpha*=.55;g.drawImage(wh,i*WBD_FW,0,WBD_FW,WBD_FH,ax,dy,w,h)}}g.restore()}
